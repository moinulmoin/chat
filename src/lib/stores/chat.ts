import { defaultModelKey } from "@/lib/chat-settings";
import { ModelKey } from "@/lib/model-registry";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — external module provided at runtime
import { persistentMap } from "@nanostores/persistent";

export interface ChatStore {
  selectedModelKey: ModelKey;
  webSearch: boolean;
}

export const chatStore = persistentMap<ChatStore>("chat:", {
  selectedModelKey: defaultModelKey,
  webSearch: false
});

export const setWebSearch = (webSearch: boolean) => {
  chatStore.setKey("webSearch", webSearch);
};

export const setSelectedModel = (modelKey: ModelKey) => {
  chatStore.setKey("selectedModelKey", modelKey);
};
