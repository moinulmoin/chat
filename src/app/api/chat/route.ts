import {
  getModelConfig,
  LanguageModelId,
  ModelKey,
  validateModelSupport
} from "@/lib/model-registry";
import { registry } from "@/lib/provider-registry";
import { redis, redisSubscriber } from "@/lib/redis";
import { getSession } from "@/server/auth";
import { generateChatTitle } from "@/server/mutations/ai";
import { saveLastMessage } from "@/server/mutations/messages";
import { createStreamId } from "@/server/mutations/streams";
import { getChatById, loadChat } from "@/server/queries/chats";
import { getLastMessageByChatId } from "@/server/queries/messages";
import { getLastStreamIdByChatId } from "@/server/queries/streams";
import { buildUsageMetadata } from "@/types";
import {
  appendClientMessage,
  appendResponseMessages,
  createDataStream,
  smoothStream,
  streamText
} from "ai";
import { differenceInSeconds } from "date-fns";
import { after, NextRequest, NextResponse } from "next/server";
import {
  createResumableStreamContext,
  type ResumableStreamContext
} from "resumable-stream/ioredis";
import { z } from "zod";
import { tools } from "./tools";

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
        publisher: redis,
        subscriber: redisSubscriber
      });
    } catch (error: any) {
      if (error.message.includes("REDIS_URL")) {
        console.log(" > Resumable streams are disabled due to missing REDIS_URL");
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

const chatRequestSchema = z.object({
  lastMessage: z.any(),
  id: z.string(),
  webSearch: z.boolean().optional(),
  modelKey: z.string().optional()
});

export async function GET(request: Request) {
  const streamContext = getStreamContext();
  const resumeRequestedAt = new Date();

  if (!streamContext) {
    return new Response(null, { status: 204 });
  }

  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("chatId");

  if (!chatId) {
    return new Response("id is required", { status: 400 });
  }

  const session = await getSession();

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const chat = await getChatById(chatId);

  if (!chat) {
    return new Response("Chat not found", { status: 404 });
  }

  if (chat.userId !== session.user?.id) {
    return new Response("Forbidden", { status: 403 });
  }

  const recentStreamId = await getLastStreamIdByChatId(chatId);

  if (!recentStreamId) {
    return new Response("No recent stream found", { status: 404 });
  }

  const emptyDataStream = createDataStream({
    execute: () => {}
  });

  const stream = await streamContext.resumableStream(recentStreamId, () => emptyDataStream);

  if (!stream) {
    /*
     * For when the generation is "active" during SSR but the
     * resumable stream has concluded after reaching this point.
     */

    const mostRecentMessage = await getLastMessageByChatId(chatId);

    if (!mostRecentMessage) {
      return new Response(emptyDataStream, { status: 200 });
    }

    if (mostRecentMessage.role !== "assistant") {
      return new Response(emptyDataStream, { status: 200 });
    }

    const messageCreatedAt = new Date(mostRecentMessage.createdAt);

    if (differenceInSeconds(resumeRequestedAt, messageCreatedAt) > 15) {
      return new Response(emptyDataStream, { status: 200 });
    }

    const restoredStream = createDataStream({
      execute: (buffer) => {
        buffer.writeData({
          type: "append-message",
          message: JSON.stringify(mostRecentMessage)
        });
      }
    });

    return new Response(restoredStream, { status: 200 });
  }

  return new Response(stream, { status: 200 });
}

export async function POST(req: NextRequest) {
  const cookieStore = req.cookies;
  const modelKeyFromCookie = cookieStore.get("modelKey")?.value as ModelKey;

  try {
    const parsed = chatRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { lastMessage, id:chatId, webSearch, modelKey: modelKeyFromRequest } = parsed.data;
    const modelKey = modelKeyFromCookie || modelKeyFromRequest;

    console.log({ modelKeyFromCookie, modelKeyFromRequest, modelKey });

    if (!chatId) {
      return new Response("chatId is required", { status: 400 });
    }

    if (!lastMessage) {
      return new Response("lastMessage is required", { status: 400 });
    }

    if (lastMessage.role !== "user") {
      return new Response("Last message must be a user message", { status: 400 });
    }

    // Validate model support
    if (!validateModelSupport(modelKey)) {
      return new Response(`Model ${modelKey} is not supported`, { status: 400 });
    }

    const session = await getSession();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const chat = await getChatById(chatId);

    if (!chat) {
      return new Response("Chat not found", { status: 404 });
    }

    if (chat.userId !== session.user?.id) {
      return new Response("Forbidden", { status: 403 });
    }

    const previousMessages = await loadChat(chatId);

    const messages = appendClientMessage({
      // @ts-expect-error: todo add type conversion from DBMessage[] to UIMessage[]
      messages: previousMessages,
      message: lastMessage
    });

    await saveLastMessage({
      id: lastMessage.id,
      chatId,
      role: lastMessage.role,
      parts: lastMessage.parts,
      attachments: lastMessage.experimental_attachments || []
    });

    await generateChatTitle(chatId, lastMessage.parts);

    // Record this new stream so we can resume later
    const streamId = await createStreamId({ chatId });

    // Build the data stream that will emit tokens
    const stream = createDataStream({
      execute: (dataStream) => {
        const modelConfig = getModelConfig(modelKey);
        const modelIdentifier = `${modelConfig.provider}:${modelKey}` as LanguageModelId;

        // Record start time to calculate generation duration
        const generationStartedAt = Date.now();
        let durationMs = 0;

        const result = streamText({
          model: registry.languageModel(modelIdentifier),
          messages,
          system: `You are a helpful assistant, powered by t0Chat.
Always reply in GitHub-Flavored Markdown (GFM) – no HTML.
Use standard Markdown features (tables, blockquotes, headings, etc) where applicable.

WebSearchTool: ${webSearch}

if webSearchTool is true, you must use the webSearch tool to search the web for information.
`,
          providerOptions: modelConfig.providerOptions,
          /*
           * Setting `required` forces the model to keep calling the tool until
           * `maxSteps` is reached (see https://github.com/vercel/ai/issues/5195).
           * Instead, let the model decide with "auto" and cap the iterations.
           */
          toolChoice: "auto",
          tools: webSearch
            ? {
                webSearch: tools.webSearch
              }
            : undefined,
          /*
           * Prevent infinite tool-call loops; 2 is usually enough (request + answer).
           */
          maxSteps: webSearch ? 2 : undefined,
          experimental_transform: [smoothStream()],
          onFinish: async ({ response, usage }) => {
            console.log(response.messages);

            if (session.user?.id) {
              durationMs = Date.now() - generationStartedAt;
              try {
                const assistantId = response.messages
                  // @ts-ignore
                  .filter((message) => message.role !== "user")
                  .at(-1)?.id;

                if (!assistantId) {
                  throw new Error("No assistant or tool message found!");
                }

                const [, assistantMessage] = appendResponseMessages({
                  messages: [lastMessage],
                  responseMessages: response.messages
                });

                if (!assistantMessage.parts) {
                  throw new Error("No assistant message found!");
                }

                const usageMeta = buildUsageMetadata({
                  modelIdentifier,
                  totalTokens: usage?.totalTokens,
                  durationMs: durationMs
                });

                await saveLastMessage({
                  id: assistantId,
                  chatId,
                  role: assistantMessage.role,
                  parts: assistantMessage.parts,
                  metadata: usageMeta
                });

                try {
                  dataStream.writeMessageAnnotation({
                    model: usageMeta.model,
                    durationMs: usageMeta.durationMs,
                    tokens: usageMeta.tokens
                  });
                } catch (err) {
                  console.error("Failed to write message annotation", err);
                }
              } catch (_) {
                console.error("Failed to save chat");
              }
            }
          }
        });

        // Start piping the stream
        result.consumeStream?.();

        // Pipe into outer data stream
        result.mergeIntoDataStream(dataStream, {
          sendSources: true,
          sendReasoning: true
        });
      },
      onError: () => "Oops, an error occurred!"
    });

    const streamContext = getStreamContext();

    if (streamContext) {
      return new Response(await streamContext.resumableStream(streamId, () => stream));
    } else {
      return new Response(stream);
    }
  } catch (error) {
    console.error(error);
    return new Response("Oops, an error occurred!", { status: 500 });
  }
}
