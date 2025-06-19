"use client";

import { ModelKey } from "@/lib/model-registry";
import { UIMessage } from "ai";
import dynamic from "next/dynamic";

const ChatClient = dynamic(() => import("@/components/chat-client").then((mod) => mod.ChatClient), {
  ssr: false
});

export default function SingleChatPage({ initialMessages, chatId, modelKey }: { initialMessages: UIMessage[], chatId: string, modelKey: ModelKey }) {
  return <ChatClient initialMessages={initialMessages} chatId={chatId as string} modelKey={modelKey} />;
}