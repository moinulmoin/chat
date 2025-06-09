import { google } from "@ai-sdk/google";
import { UIMessage, convertToModelMessages, smoothStream, streamText } from "ai";
import { Metadata } from "./metadata-schema";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const startTime = Date.now();

  const result = streamText({
    model: google("gemini-2.5-flash-preview-05-20"),
    system: "You are t0Chat, a helpful assistant. Always respond in markdown format.",
    messages: convertToModelMessages(messages),
    providerOptions: {
      google: {
        thinkingConfig: {
          thinkingBudget: 0
        }
      }
    },
    experimental_transform: [smoothStream()]
  });

  return result.toUIMessageStreamResponse({
    messageMetadata: ({ part }): Metadata | undefined => {
      if (part.type === "start-step") {
        return {
          model: "Gemini 2.5 Flash",
        }
      }

      // send additional model information on finish-step:
      if (part.type === "finish-step") {
        return {
          duration: Date.now() - startTime
        };
      }

      // when the message is finished, send additional information:
      if (part.type === "finish") {
        return {
          totalTokens: part.totalUsage.totalTokens,
        };
      }
    }
  });
}
