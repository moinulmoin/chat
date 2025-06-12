import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { availableModels, defaultModelKey, features } from "./chat-settings"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const modelsProvider =  {
    model: availableModels.find(m => m.key === defaultModelKey)?.label || "Gemini 2.5 Flash",
    modelKey: defaultModelKey,
    availableModels,
    features,
  }
