import { Message } from "ai";

export interface Chat extends Record<string, any> {
  id: string;
  title: string;
  createdAt: Date;
  userId: string;
  path: string;
  messages: Message[];
  sharePath?: string;
}

export type ServerActionResult<Result> = Promise<
  | Result
  | {
      error: string;
    }
>;

export type ChatStatus = "submitted" | "streaming" | "ready" | "error";

export interface UsageMetadata {
  model: string;
  tokens: number | null;
  durationMs: number;
}

export function buildUsageMetadata(params: {
  modelIdentifier: string;
  totalTokens: number | null | undefined;
  durationMs: number; // ms timestamp
}): UsageMetadata {
  return {
    model: params.modelIdentifier,
    tokens: params.totalTokens ?? null,
    durationMs: params.durationMs,
  };
}