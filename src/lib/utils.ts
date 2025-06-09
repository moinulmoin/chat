import { ChatState } from "ai";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const chatData = {
  messages: [
    {
      id: 1,
      role: "user" as const,
      content: "damnnnn",
      timestamp: new Date().toISOString()
    },
    {
      id: 2,
      role: "assistant" as const,
      content: "Yo, what's got you so hyped? Spill the tea!",
      timestamp: "1.3s"
    }
  ],
  user: {
    name: "User",
    avatar: "https://github.com/moinulmoin.png"
  },
  settings: {
    model: "Gemini 2.5 Flash",
    availableModels: ["Gemini 2.5 Flash", "Gemini 2.5 Pro"],
    features: {
      search: true,
      think: true,
    }
  }
}


// const chatStore = new ChatState({
//   api: '/api/chat', // your chat endpoint
//   maxSteps: 5, // optional: limit LLM calls in tool chains
//   chats: {}, // optional: preload previous chat sessions
// });
