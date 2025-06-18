import { registry } from "@/lib/provider-registry";
import { updateChatTitle } from "@/server/mutations/chats";
import { generateText, TextPart, UIMessage } from "ai";

/**
 * Generate a concise chat title based on the user's first message and store it.
 */

export async function generateChatTitle(chatId: string, messageParts: UIMessage["parts"]) {
  try {
    if (!messageParts.length) return;

    const messageText = messageParts
      .filter((p): p is TextPart => p.type === "text")
      .map((p) => p.text)
      .join(" ")
      .slice(0, 1000);

    if (messageText.trim().length === 0) return;

    const { text } = await generateText({
      model: registry.languageModel("google:gemini-2.5-flash-lite"),
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
