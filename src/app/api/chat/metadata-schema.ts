import { z } from "zod/v4";

export const metadataSchema = z.object({
  duration: z.number().optional(),
  model: z.string().optional(),
  totalTokens: z.number().optional(),
});

export type Metadata = z.infer<typeof metadataSchema>;