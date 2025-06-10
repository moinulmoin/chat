"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { UIMessage } from "ai";
import { useQuery } from "convex/react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";

const ChatClient = dynamic(() => import("@/components/chat-client").then((mod) => mod.ChatClient), {
  ssr: false
});

export default function SingleChatPage() {
  const params: { chatId: Id<"chats"> } = useParams();
  const chatMessages = useQuery(api.chat.loadChat, {
    chatId: params.chatId
  });

  const messages = chatMessages?.map((message) => ({
    id: message._id,
    role: message.role,
    parts: message.parts,
    createdAt: message._creationTime
  })) as unknown as UIMessage[];

  return <ChatClient initialMessages={messages || []} />;
}