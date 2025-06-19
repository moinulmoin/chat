import { Chat, Message, User } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { Attachment, UIMessage } from "ai";
import { notFound } from "next/navigation";
import { ShareChatClient } from "./page.client";

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: publicId } = await params;

  const chat = (await prisma.chat.findFirst({
    where: { publicId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: { attachments: true }
      },
      user: {
        select: {
          name: true
        }
      }
    }
  })) as unknown as Chat & { messages: (Message & { attachments: Attachment[] })[]; user: User };

  if (!chat) {
    notFound();
  }

  // Transform database messages to UIMessage format
  const transformedMessages = chat.messages.map((msg) => ({
    id: msg.id,
    role: msg.role as "user" | "assistant",
    parts: msg.parts as any,
    createdAt: msg.createdAt,
    experimental_attachments: msg.attachments.map((att) => ({
      name: att.name,
      url: att.url,
      contentType: att.contentType
    })),
    annotations: msg.metadata ? [msg.metadata] : undefined
  }));

  return (
    <ShareChatClient
      title={chat.title ?? "Shared chat"}
      initialMessages={transformedMessages as unknown as UIMessage[]}
      author={chat.user.name ?? "Anonymous"}
    />
  );
}
