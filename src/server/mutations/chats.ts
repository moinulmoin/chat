import { prisma } from "@/lib/prisma";

export async function createChat(data: {
  userId: string;
  title?: string;
}) {
  const chat = await prisma.chat.create({
    data: {
      userId: data.userId,
      title: data.title,
    },
  });
  return chat.id;
}

export async function updateChat(id: string, data: {
  title?: string;
}) {
  return await prisma.chat.update({
    where: {
      id: id,
    },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });
}

export async function deleteChat(id: string) {
  return await prisma.chat.delete({
    where: {
      id: id,
    },
  });
}

export async function deleteChatsByUserId(userId: string) {
  return await prisma.chat.deleteMany({
    where: {
      userId: userId,
    },
  });
}

export async function updateChatTitle(id: string, title: string) {
  return await prisma.chat.update({
    where: {
      id: id,
    },
    data: {
      title: title,
    },
  });
}