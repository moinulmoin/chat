import { loadChat } from "@/server/queries/chats";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const chatId = params.id;
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "30", 10);

  if (!chatId) {
    return NextResponse.json({ error: "chatId is required" }, { status: 400 });
  }

  try {
    const messages = await loadChat(chatId, page, limit);
    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}
