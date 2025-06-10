import { prisma } from "@/lib/prisma";

export async function getStreamsByChatId(chatId: string) {
  return await prisma.stream.findMany({
    where: {
      chatId: chatId,
    },
  });
}

export async function getStreamById(id: string) {
  return await prisma.stream.findUnique({
    where: {
      id: id,
    },
    include: {
      chat: true,
    },
  });
}

export async function getLastStreamIdByChatId(chatId: string) {
  const stream = await prisma.stream.findFirst({
    where: {
      chatId: chatId,
    },
    orderBy: {
      id: "desc",
    },
  });
  return stream?.id;
}