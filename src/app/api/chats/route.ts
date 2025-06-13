import { getSession } from "@/server/auth";
import { getChatsByUserId } from "@/server/queries/chats";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await getSession();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }
        const chats = await getChatsByUserId(session.user.id);
        return NextResponse.json(chats);
    } catch (error) {
        console.error("[CHATS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}