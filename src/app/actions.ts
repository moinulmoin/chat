"use server";

import { deleteChat as deleteChatMutation, updateChatTitle as updateChatTitleMutation } from "@/server/mutations/chats";
import { revalidatePath } from "next/cache";

export async function deleteChat(id: string) {
    await deleteChatMutation(id);
    revalidatePath("/");
}

export async function updateChatTitle(id: string, title: string) {
    await updateChatTitleMutation(id, title);
    revalidatePath("/");
}