"use client";

import { UIMessage } from "ai";
import dynamic from "next/dynamic";

const ChatClient = dynamic(() => import("@/components/chat-client").then((mod) => mod.ChatClient), {
  ssr: false
});

export default function SingleChatPage({ initialMessages, chatId }: { initialMessages: UIMessage[], chatId: string }) {
  return <ChatClient initialMessages={initialMessages} chatId={chatId as string} />;
}