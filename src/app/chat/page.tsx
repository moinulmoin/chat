"use client";

import dynamic from "next/dynamic";

const ChatClient = dynamic(() => import("@/components/chat-client").then((mod) => mod.ChatClient), {
  ssr: false,
});

export default function ChatPage() {
  return <ChatClient initialMessages={[]} />;
}
