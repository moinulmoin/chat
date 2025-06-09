import { api } from "@/convex/_generated/api";
import dynamic from "next/dynamic";

const ChatClient = dynamic(() => import("@/components/chat-client").then((mod) => mod.ChatClient), {
  ssr: false
});

export default async function SingleChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // const { data: chat } = await api.chats.getChat({ id });
  return <ChatClient initialMessages={[]} />;
}
