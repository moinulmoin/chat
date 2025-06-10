import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { convex } from "@/lib/http-client";
import { google } from "@ai-sdk/google";
import {
  convertToCoreMessages,
  createDataStream,
  Message,
  smoothStream,
  streamText,
  UIMessage
} from "ai";
import { after } from "next/server";
import { createResumableStreamContext } from "resumable-stream";

export const maxDuration = 60;

const streamContext = createResumableStreamContext({
  waitUntil: after
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("chatId");

  if (!chatId) {
    return new Response("id is required", { status: 400 });
  }

  const user = await convex.query(api.auth.currentUser);
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const chat = await convex.query(api.chat.getChatById, {
    chatId: chatId as Id<"chats">
  });

  if (!chat) {
    return new Response("Chat not found", { status: 404 });
  }

  if (chat.userId !== user._id) {
    return new Response("Forbidden", { status: 403 });
  }

  const recentStreamId = await convex.query(api.chat.getLastStreamIdByChatId, {
    chatId: chatId as Id<"chats">
  });

  if (!recentStreamId) {
    return new Response("No recent stream found", { status: 404 });
  }

  const emptyDataStream = createDataStream({
    execute: () => {}
  });

  const stream = await streamContext.resumableStream(recentStreamId, () => emptyDataStream);

  if (stream) {
    return new Response(stream, { status: 200 });
  }

  /*
   * For when the generation is "active" during SSR but the
   * resumable stream has concluded after reaching this point.
   */

  const recentMessage = await convex.query(api.chat.getLastMessageByChatId, {
    chatId: chatId as Id<"chats">
  });

  if (!recentMessage || recentMessage.role !== "assistant") {
    return new Response(emptyDataStream, { status: 200 });
  }

  const streamWithMessage = createDataStream({
    execute: (buffer) => {
      buffer.writeData({
        type: "append-message",
        message: JSON.stringify(recentMessage)
      });
    }
  });

  return new Response(streamWithMessage, { status: 200 });
}

export async function POST(request: Request) {
  const { chatId, lastMessage } = (await request.json()) as {
    chatId: Id<"chats">;
    lastMessage: UIMessage;
  };

  if (!chatId) {
    return new Response("chatId is required", { status: 400 });
  }


  if (!lastMessage) {
    return new Response("lastMessage is required", { status: 400 });
  }

  const user = await convex.query(api.auth.currentUser);
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const chat = await convex.query(api.chat.getChatById, {
    chatId: chatId as Id<"chats">
  });

  if (!chat) {
    return new Response("Chat not found", { status: 404 });
  }

  if (chat.userId !== user._id) {
    return new Response("Forbidden", { status: 403 });
  }

  if (lastMessage.role !== "user") {
    return new Response("Last message must be a user message", { status: 400 });
  }

  const messages = await convex.query(api.chat.loadChat, { chatId });

  // Record this new stream so we can resume later
  const streamId = await convex.mutation(api.chat.createStreamId, { chatId });

  // Build the data stream that will emit tokens
  const stream = createDataStream({
    execute: (dataStream) => {
      const result = streamText({
        model: google("gemini-2.5-flash-preview-05-20"),
        system: "You are t0Chat, a helpful assistant. Always respond in markdown format.",
        messages: convertToCoreMessages(messages as unknown as Omit<Message, "id">[]),
        providerOptions: {
          google: {
            thinkingConfig: {
              thinkingBudget: 0
            }
          }
        },
        experimental_transform: [smoothStream()]
      });

      // Retur n a resumable stream to the client
      result.mergeIntoDataStream(dataStream);
    }
  });

  return new Response(await streamContext.resumableStream(streamId, () => stream));
}
