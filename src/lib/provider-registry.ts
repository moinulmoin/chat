import { google as originalGoogle } from "@ai-sdk/google";
import { groq as originalGroq } from "@ai-sdk/groq";
import { openai as originalOpenAI } from "@ai-sdk/openai";
import { xai as originalXai } from "@ai-sdk/xai";
import {
  createProviderRegistry,
  customProvider
} from "ai";
import { z } from "zod";

// Centralised provider registry – every part of the app should import from here
// instead of creating its own provider instances.
//
// The provider IDs must match the `provider` field values in `MODELS` from
// `model-registry.ts` so that `registry.languageModel("{provider}:{id}")` works
// seamlessly.

// -------------------------------------------------------------
// Custom provider wrappers to expose nicer alias names per model
// -------------------------------------------------------------

// OpenAI – expose alias names and keep full fallback
const openaiProvider = customProvider({
  languageModels: {
    "gpt-4.1": originalOpenAI("gpt-4.1"),
    "gpt-4.1-mini": originalOpenAI("gpt-4.1-mini"),
    "o4-mini": originalOpenAI("o4-mini"),
    "gpt-image-gen": originalOpenAI("gpt-4o-mini-image-gen")
  },
});

// Google Gemini – keep aliases for Flash & Pro
const googleProvider = customProvider({
  languageModels: {
    "gemini-2.5-flash": originalGoogle("gemini-2.5-flash-preview-05-20"),
    "gemini-2.5-flash-thinking": originalGoogle("gemini-2.5-flash-preview-05-20"),
    "gemini-2.5-pro": originalGoogle("gemini-2.5-pro-preview-06-05"),
    "gemini-2.5-flash-lite": originalGoogle("gemini-2.5-flash-lite-preview-06-17")
  },
});

// Groq and xAI are pure pass-through (no aliases for now)
const groqProvider = customProvider({
  languageModels: {
    "llama4-scout": originalGroq("meta-llama/llama-4-scout-17b-16e-instruct"),
    "qwen3-32b": originalGroq("qwen/qwen3-32b"),
    "qwen3-32b-thinking": originalGroq("qwen/qwen3-32b")
  },
});

const xaiProvider = customProvider({
  languageModels: {
    "grok-3": originalXai("grok-3"),
    "grok-3-mini": originalXai("grok-3-mini")
  },
});

export const registry = createProviderRegistry({
  openai: openaiProvider,
  google: googleProvider,
  groq: groqProvider,
  xai: xaiProvider,
});

export type ProviderKey = "openai" | "google" | "groq" | "xai";

// Validate that the required environment variables for the providers are set.
// This is used by `env-validation.ts` to show a warning to the developer.
export function validateProviderKeys() {
  const missing: string[] = [];

  if (!process.env.OPENAI_API_KEY) missing.push("OPENAI_API_KEY");
  if (!process.env.GOOGLE_AI_API_KEY) missing.push("GOOGLE_AI_API_KEY");
  if (!process.env.GROQ_API_KEY) missing.push("GROQ_API_KEY");
  if (!process.env.XAI_API_KEY) missing.push("XAI_API_KEY");

  return missing;
}
