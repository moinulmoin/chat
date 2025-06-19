import ChatClient from "@/app/chat/[id]/page.client";
import { defaultModelKey } from "@/lib/chat-settings";
import { ModelKey } from "@/lib/model-registry";
import { getMessagesByChatId } from "@/server/queries/messages";
import { UIMessage } from "ai";
import { cookies } from "next/headers";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const modelKey = (cookieStore.get("modelKey")?.value as ModelKey) || defaultModelKey;
  const messages = await getMessagesByChatId(id);
  return (
    <ChatClient
      initialMessages={messages as unknown as UIMessage[]}
      chatId={id}
      modelKey={modelKey}
    />
  );
}
