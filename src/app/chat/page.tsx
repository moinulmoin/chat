import { getSession } from "@/server/auth";
import { createChat } from "@/server/mutations/chats";
import { redirect } from "next/navigation";

export default async function ChatPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/signin");
  }
  const chatId = await createChat({ userId: session.user.id, title: "New Chat" });
  redirect(`/chat/${chatId}`);
}
