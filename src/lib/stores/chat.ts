import { defaultModelKey } from "@/lib/chat-settings";
import { ModelKey } from "@/lib/model-registry";
import { persistentAtom } from "@nanostores/persistent";
import { atom, map } from "nanostores";

export interface ChatStore {
  selectedModelKey: ModelKey;
  webSearch: boolean;
}

// Atom persisted to localStorage for model key only
export const currentModelKeyAtom = persistentAtom<ModelKey>(
  "current-model-key",
  defaultModelKey,
  { listen: false }
);

// Map store for rest of UI state (not persistent)
export const webSearchAtom = atom<boolean>(false)

export const toogleWebSearch = () => {
  webSearchAtom.set(!webSearchAtom.get())
}
