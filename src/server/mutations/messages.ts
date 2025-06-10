import { prisma } from "@/lib/prisma";

export async function createMessage(data: {
  chatId: string;
  role: string;
  parts: any;
  metadata?: any;
}) {
  return await prisma.message.create({
    data: {
      chatId: data.chatId,
      role: data.role,
      parts: data.parts,
      metadata: data.metadata,
    },
  });
}

export async function updateMessage(id: string, data: {
  role?: string;
  parts?: any;
  metadata?: any;
}) {
  return await prisma.message.update({
    where: {
      id: id,
    },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });
}

export async function deleteMessage(id: string) {
  return await prisma.message.delete({
    where: {
      id: id,
    },
  });
}

export async function deleteMessagesByChatId(chatId: string) {
  return await prisma.message.deleteMany({
    where: {
      chatId: chatId,
    },
  });
}

export async function saveLastMessage(data: {
  id?: string;
  chatId: string;
  role: string;
  parts?: any;
}) {
  return await prisma.message.create({
    data: {
      id: data.id,
      chatId: data.chatId,
      role: data.role,
      parts: data.parts,
    },
  });
}