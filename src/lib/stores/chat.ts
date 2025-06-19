import { defaultModelKey } from "@/lib/chat-settings";
import { ModelKey } from "@/lib/model-registry";
import { persistentAtom } from "@nanostores/persistent";
import { map } from "nanostores";

export interface ChatStore {
  selectedModelKey: ModelKey;
  webSearch: boolean;
}

// Atom persisted to localStorage for model key only
export const selectedModelKeyAtom = persistentAtom<ModelKey>(
  "selectedModelKey",
  defaultModelKey
);

// Map store for rest of UI state (not persistent)
export const chatStore = map<ChatStore>({
  selectedModelKey: selectedModelKeyAtom.get(),
  webSearch: false
});

// Keep stores in sync
selectedModelKeyAtom.subscribe((value: ModelKey) => {
  chatStore.setKey("selectedModelKey", value);
});

export const setWebSearch = (webSearch: boolean) => {
  chatStore.setKey("webSearch", webSearch);
};

export const setSelectedModel = (modelKey: ModelKey) => {
  selectedModelKeyAtom.set(modelKey);
};
