import { loadChat } from "@/server/queries/chats";
import { UIMessage } from "ai";
import SingleChatPageClient from "./page.client";


export default async function SingleChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: chatId } = await params;

  const messages = await loadChat(chatId) as unknown as UIMessage[];

  return <SingleChatPageClient initialMessages={messages || []} chatId={chatId} />;
}