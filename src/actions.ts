"use server";

import { prisma } from "@/lib/prisma";
import { deleteMessage, updateMessage } from "@/server/mutations/messages";
import { getMessageById } from "@/server/queries/messages";
import { TextPart } from "ai";
import { randomBytes } from "crypto";

export async function deleteLastMessageAction(messageId: string) {
  return await deleteMessage(messageId);
}

export async function deleteTrailingMessagesAction(messageId: string) {
  const message = await getMessageById(messageId);

  if (!message) {
    throw new Error("Message not found");
  }

  return await prisma.message.deleteMany({
    where: {
      chatId: message.chatId,
      createdAt: {
        gte: message.createdAt,
      },
    },
  });
}

export async function branchChatAction(messageId: string) {
  "use server";

  // 1. Locate the clicked message and its chat.
  const clickedMessage = await prisma.message.findUnique({
    where: { id: messageId },
    include: { chat: true },
  });

  if (!clickedMessage) {
    throw new Error("Message not found");
  }

  if (clickedMessage.role === "user") {
    throw new Error("Cannot branch from a user message");
  }

  const { chat } = clickedMessage

  // 2. Fetch the clicked message + the message right before it (ordered by createdAt).
  const twoMessages = await prisma.message.findMany({
    where: {
      chatId: chat.id,
      createdAt: {
        lte: clickedMessage.createdAt,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 2,
  });

  // Reverse so we keep chronological order (oldest first).
  const messagesToCopy = twoMessages.reverse();
  const chatTitle = (messagesToCopy?.[0]?.parts as unknown as TextPart[])?.map((part: TextPart) => part.text).join("");
  // 3. Create a fresh chat for the user.
  const newChat = await prisma.chat.create({
    data: {
      userId: chat.userId,
      title: chatTitle,
      parentChatId: chat.id,
    },
  });

  // 4. Replicate each of the two messages into the new chat.
  for (const msg of messagesToCopy) {
    await prisma.message.create({
      data: {
        chatId: newChat.id,
        role: msg.role,
        parts: msg.parts as any,
        metadata: msg.metadata as any,
      },
    });
  }

  return newChat.id;
}

export async function shareChatAction(chatId: string) {
  const chat = await prisma.chat.findUnique({ where: { id: chatId } });
  if (!chat) throw new Error("Chat not found");

  if (chat.publicId) return chat.publicId;

  const publicId = randomBytes(8).toString("base64url");

  await prisma.chat.update({
    where: { id: chatId },
    data: { publicId }
  });

  return publicId;
}

export async function updateMessageAction(messageId: string, newContent: string) {
  const parts: TextPart[] = [{ type: "text", text: newContent }];
  return await updateMessage(messageId, { parts });
}
