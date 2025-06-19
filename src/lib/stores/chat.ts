import { defaultModelKey } from "@/lib/chat-settings";
import { ModelKey } from "@/lib/model-registry";
import { persistentAtom } from "@nanostores/persistent";
import { atom } from "nanostores";

export interface ChatStore {
  webSearch: boolean;
}

export const currentModelKeyAtom = persistentAtom<ModelKey>("current-model-key", defaultModelKey, {
  listen: false
});

export const webSearchAtom = atom(false);
export const toggleWebSearch = () => webSearchAtom.set(!webSearchAtom.get());

export const setModelKey = (modelKey: ModelKey) => {
  // Update the atom
  currentModelKeyAtom.set(modelKey);

  // Set the cookie
  if (typeof document !== 'undefined') {
    document.cookie = `modelKey=${modelKey}; path=/; ${process.env.NODE_ENV === 'production' ? 'secure;' : ''} samesite=lax`;
  }
};
