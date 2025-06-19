import { prisma } from "@/lib/prisma";

export async function getMessagesByChatId(chatId: string) {
  return await prisma.message.findMany({
    where: {
      chatId: chatId,
    },
    orderBy: {
      createdAt: "asc",
    },
    include: {
      attachments: true,
    },
  });
}

export async function getMessageById(id: string) {
  return await prisma.message.findUnique({
    where: {
      id: id,
    },
  });
}

export async function getLastMessageByChatId(chatId: string) {
  return await prisma.message.findFirst({
    where: {
      chatId: chatId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}