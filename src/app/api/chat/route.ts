import { getSession } from "@/server/auth";
import { saveLastMessage } from "@/server/mutations/messages";
import { createStreamId } from "@/server/mutations/streams";
import { getChatById, loadChat } from "@/server/queries/chats";
import { getLastMessageByChatId } from "@/server/queries/messages";
import { getLastStreamIdByChatId } from "@/server/queries/streams";
import { google } from "@ai-sdk/google";
import {
  appendClientMessage,
  appendResponseMessages,
  createDataStream,
  smoothStream,
  streamText,
  UIMessage
} from "ai";
import { differenceInSeconds } from "date-fns";
import { after } from "next/server";
import { createResumableStreamContext, type ResumableStreamContext } from "resumable-stream";

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after
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

export async function POST(request: Request) {
  try {
    const { chatId, lastMessage } = (await request.json()) as {
      chatId: string;
      lastMessage: UIMessage;
    };

    if (!chatId) {
      return new Response("chatId is required", { status: 400 });
    }

    if (!lastMessage) {
      return new Response("lastMessage is required", { status: 400 });
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

    if (lastMessage.role !== "user") {
      return new Response("Last message must be a user message", { status: 400 });
    }

    const previousMessages = await loadChat(chatId);

    const messages = appendClientMessage({
      // @ts-expect-error: todo add type conversion from DBMessage[] to UIMessage[]
      messages: previousMessages,
      message: lastMessage
    });

    await saveLastMessage({
      chatId,
      role: lastMessage.role,
      parts: lastMessage.parts,
    });

    // Record this new stream so we can resume later
    const streamId = await createStreamId({ chatId });

    // Build the data stream that will emit tokens
    const stream = createDataStream({
      execute: (dataStream) => {
        const result = streamText({
          model: google("gemini-2.5-flash-preview-05-20"),
          system: "You are t0Chat, a helpful assistant. Always respond in markdown format.",
          messages,
          providerOptions: {
            google: {
              thinkingConfig: {
                thinkingBudget: 0
              }
            }
          },
          experimental_transform: [smoothStream()],
          onFinish: async ({ response }) => {
            if (session.user?.id) {
              try {
                const assistantId = response.messages
                  .filter((message) => message.role === "assistant")
                  .at(-1)?.id;

                if (!assistantId) {
                  throw new Error("No assistant message found!");
                }

                const [, assistantMessage] = appendResponseMessages({
                  messages: [lastMessage],
                  responseMessages: response.messages
                });

                await saveLastMessage({
                  id: assistantId,
                  chatId,
                  role: assistantMessage.role,
                  parts: assistantMessage.parts,
                });
              } catch (_) {
                console.error("Failed to save chat");
              }
            }
          }
        });
        result.consumeStream();

        // Return a resumable stream to the client
        result.mergeIntoDataStream(dataStream);
      },
      onError: () => {
        return "Oops, an error occurred!";
      }
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
