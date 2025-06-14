import { prisma } from "@/lib/prisma";
import { UIMessage } from "ai";
import { notFound } from "next/navigation";
import { ShareChatClient } from "./page.client";

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: publicId } = await params;

  const chat = await prisma.chat.findFirst({
    where: { publicId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      user: {
        select: {
          name: true,
        }
      }
    }
  });

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