import { prisma } from "@/lib/prisma";

export async function getChatsByUserId(userId: string) {
  return await prisma.chat.findMany({
    where: {
      userId: userId,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

export async function getChatById(id: string) {
  return await prisma.chat.findFirst({
    where: {
      id: id,
    },
  });
}

export async function getChatWithMessages(chatId: string) {
  return await prisma.chat.findUnique({
    where: {
      id: chatId,
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });
}


export async function loadChat(chatId: string) {
  const messages = await prisma.message.findMany({
    where: {
      chatId: chatId,
    },
  });
  return messages;
}

export async function getChatDetailsById(chatId: string) {
  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });
  return chat;
}