import { prisma } from "@/lib/prisma";

export async function createStream(data: {
  chatId: string;
}) {
  return await prisma.stream.create({
    data: {
      chatId: data.chatId,
    },
  });
}

export async function deleteStream(id: string) {
  return await prisma.stream.delete({
    where: {
      id: id,
    },
  });
}

export async function deleteStreamsByChatId(chatId: string) {
  return await prisma.stream.deleteMany({
    where: {
      chatId: chatId,
    },
  });
}

export async function createStreamId(data: {
  chatId: string;
}) {
  const stream = await prisma.stream.create({
    data: {
      chatId: data.chatId,
    },
  });
  return stream.id;
}