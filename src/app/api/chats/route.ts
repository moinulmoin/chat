import { getSession } from "@/server/auth";
import { getChatsByUserId } from "@/server/queries/chats";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const title = searchParams.get("title") || undefined;
        const chats = await getChatsByUserId(session.user.id, page, limit, title);
        return NextResponse.json(chats);
    } catch (error) {
        console.error("[CHATS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}