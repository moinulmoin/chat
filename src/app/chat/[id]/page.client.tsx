"use client";

import { UIMessage } from "ai";
import dynamic from "next/dynamic";

const ChatClient = dynamic(() => import("@/components/chat-client").then((mod) => mod.ChatClient), {
  ssr: false
});

export default function SingleChatPage({ chatId, initialMessages }: { chatId: string, initialMessages: UIMessage[] }) {
  return <ChatClient initialMessages={initialMessages} chatId={chatId} />;
}