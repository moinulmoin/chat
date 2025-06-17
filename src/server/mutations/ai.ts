import { registry } from "@/lib/provider-registry";
import { updateChatTitle } from "@/server/mutations/chats";
import { generateText, TextPart } from "ai";

/**
 * Generate a concise chat title based on the user's first message and store it.
 */

export async function generateChatTitle(chatId: string, message: TextPart[]) {
  try {
    if (!message.length) return;

    const messageText = message
      .filter((p): p is TextPart => p.type === "text")
      .map((p) => p.text)
      .join(" ")
      .slice(0, 1000);

    const { text } = await generateText({
      model: registry.languageModel("t0chat:title-gen"),
      prompt: `Generate a title summarising the user's message. The title should be a single sentence that captures the main idea of the user's message. The title should be no more than 40 characters. Do not include any symbols in your response.

      User message: ${messageText}

      Title:`
    });

    const generatedTitle = text.trim().replace(/^"|"$/g, "");

    if (generatedTitle.length > 0) {
      await updateChatTitle(chatId, generatedTitle);
    }
  } catch (error) {
    console.error("[generateChatTitle] failed", error);
  }
}
