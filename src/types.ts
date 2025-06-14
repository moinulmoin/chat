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