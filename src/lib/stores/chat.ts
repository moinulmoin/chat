import { defaultModelKey } from "@/lib/chat-settings";
import { ModelKey } from "@/lib/model-registry";
import { map } from "nanostores";

export interface ChatStore {
  selectedModelKey: ModelKey;
  webSearch: boolean;
}

export const chatStore = map<ChatStore>({
  selectedModelKey: defaultModelKey,
  webSearch: false
});

// Persist selectedModelKey to localStorage (client-side only)
if (typeof window !== "undefined") {
  const storedModelKey = window.localStorage.getItem("selectedModelKey");
  if (storedModelKey) {
    chatStore.setKey("selectedModelKey", storedModelKey as ModelKey);
  }

  chatStore.subscribe((current) => {
    window.localStorage.setItem("selectedModelKey", current.selectedModelKey);
  });
}

export const setWebSearch = (webSearch: boolean) => {
  chatStore.setKey("webSearch", webSearch);
};

export const setSelectedModel = (modelKey: ModelKey) => {
  chatStore.setKey("selectedModelKey", modelKey);
};
