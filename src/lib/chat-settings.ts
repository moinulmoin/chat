import { Capability, getAvailableModels, ModelKey } from './model-registry';

export const availableModels = getAvailableModels().map(({ key, config }) => ({
  key,
  label: config.displayName,
  description: config.description,
  capabilities: config.capabilities,
}));

export type AvailableModel = typeof availableModels[number];

export const defaultModelKey: ModelKey = 'gemini-2.5-flash';

export const features = {
  tooling: true,
  thinking: true,
  fileUpload: true,
  imageGeneration: true,
  imageUpload: true,
} as const;

export function getModelCapabilities(modelKey: ModelKey): Record<Capability, boolean> {
  const model = availableModels.find(m => m.key === modelKey);
  return model?.capabilities || {
    tooling: false,
    thinking: false,
    fileUpload: false,
    imageGeneration: false,
    imageUpload: false,
  };
}

export function isCapabilitySupported(modelKey: ModelKey, capability: Capability): boolean {
  const capabilities = getModelCapabilities(modelKey);
  return capabilities[capability] && features[capability];
}