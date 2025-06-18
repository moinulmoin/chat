import { prisma } from "@/lib/prisma";
import { Attachment, Message, UIMessage } from "ai";
import { notFound } from "next/navigation";
import { ShareChatClient } from "./page.client";
import { Chat, User } from "@/generated/prisma";

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: publicId } = await params;

  const chat = (await prisma.chat.findFirst({
    where: { publicId },
    include: {
      messages: { orderBy: { createdAt: "asc" }, include: { attachments: true } },
      user: {
        select: {
          name: true
        }
      },
      attachments: true
    }
  })) as unknown as Chat & { messages: (Message & { attachments: Attachment[] })[]; user: User };

  if (!chat) {
    notFound();
  }

  return (
    <ShareChatClient
      title={chat.title ?? "Shared chat"}
      initialMessages={chat.messages as unknown as UIMessage[]}
      author={chat.user.name ?? "Anonymous"}
    />
  );
}
