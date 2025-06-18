import { Attachment, Message } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

export async function getChatsByUserId(
  userId: string,
  page: number = 1,
  limit: number = 20,
  title?: string
) {
  return await prisma.chat.findMany({
    where: {
      userId: userId,
      ...(title && {
        title: {
          contains: title,
          mode: "insensitive",
        },
      }),
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
  const messagesFromDb = await prisma.message.findMany({
    where: {
      chatId: chatId
    },
    orderBy: {
      createdAt: "desc"
    },
    include: {
      attachments: true
    },
    skip: (page - 1) * limit,
    take: limit
  }) as (Message & { attachments: Attachment[] })[]

  const messages = messagesFromDb.map(message => {
    const { attachments, ...rest } = message

    const mappedAttachments = message.attachments.map((att) => ({
      name: att.name,
      contentType: att.contentType,
      url: att.url,
    }));


    return {
      ...rest,
      attachments: mappedAttachments,
    };
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