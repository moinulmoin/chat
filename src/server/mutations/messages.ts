import { prisma } from "@/lib/prisma";
import { UIMessage } from "ai";

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
      metadata: data.metadata
    }
  });
}

export async function updateMessage(
  id: string,
  data: {
    role?: string;
    parts?: any;
    metadata?: any;
  }
) {
  return await prisma.message.update({
    where: {
      id: id
    },
    data: {
      ...data,
      updatedAt: new Date()
    }
  });
}

export async function deleteMessage(id: string) {
  return await prisma.message.delete({
    where: {
      id: id
    }
  });
}

export async function deleteMessagesByChatId(chatId: string) {
  return await prisma.message.deleteMany({
    where: {
      chatId: chatId
    }
  });
}

export async function saveLastMessage(data: {
  id?: string;
  chatId: string;
  role: string;
  parts?: any;
  metadata?: any;
  attachments?: UIMessage["experimental_attachments"]
}) {
  const message = await prisma.message.upsert({
    where: { id: data.id },
    update: {
      role: data.role,
      parts: data.parts,
      metadata: data.metadata,
    },
    create: {
      id: data.id,
      chatId: data.chatId,
      role: data.role,
      parts: data.parts,
      metadata: data.metadata,
      attachments: {
      }
    }
  });

  if (data.role === "user" && data.parts && data.attachments) {

    if (data.attachments[0]) {

      await prisma.attachment.create({
        data: {        messageId: message.id,
          chatId: data.chatId,
          url: data.attachments[0].url,
          name: data.attachments[0].name!,
          contentType: data.attachments[0].contentType!
        }
      });
    }
  }

  return message;
}
