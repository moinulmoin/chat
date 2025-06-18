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

export const toggleWebSearch = () => {
  chatStore.setKey("webSearch", !chatStore.get().webSearch);
};

export const setSelectedModel = (modelKey: ModelKey) => {
  chatStore.setKey("selectedModelKey", modelKey);
};
