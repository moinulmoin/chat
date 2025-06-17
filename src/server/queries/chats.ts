import { prisma } from "@/lib/prisma";

export async function getChatsByUserId(
  userId: string,
  page: number = 1,
  limit: number = 20
) {
  return await prisma.chat.findMany({
    where: {
      userId: userId,
    },
    orderBy: {
      updatedAt: "desc",
    },
    skip: (page - 1) * limit,
    take: limit,
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


export async function loadChat(
  chatId: string,
  page: number = 1,
  limit: number = 30
) {
  const messages = await prisma.message.findMany({
    where: {
      chatId: chatId
    },
    orderBy: {
      createdAt: "desc"
    },
    skip: (page - 1) * limit,
    take: limit
  });

  // Since we are fetching in descending order to get pages from the end,
  // we need to reverse them to display in correct chronological order.
  return messages.reverse();
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