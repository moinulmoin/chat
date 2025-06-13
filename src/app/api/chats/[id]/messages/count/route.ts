import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const messageCount = await prisma.message.count({
      where: {
        chatId: id,
      },
    });

    return NextResponse.json({ count: messageCount });
  } catch (error) {
    console.error("[MESSAGE_COUNT_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}