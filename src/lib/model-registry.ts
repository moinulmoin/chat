export type Capability = 'tooling' | 'thinking' | 'fileUpload' | 'imageGeneration' | 'imageUpload';

export interface ModelConfig {
  provider: string;
  id: string;
  capabilities: Record<Capability, boolean>;
  providerOptions?: Record<string, any>;
  displayName: string;
  description?: string;
}

const DEFAULT_CAPABILITIES: Record<Capability, boolean> = {
  tooling: false,
  thinking: false,
  fileUpload: false,
  imageGeneration: false,
  imageUpload: false,
};

export const MODELS = {
  'gpt-4.1': {
    provider: 'openai',
    id: 'gpt-4.1',
    displayName: 'GPT 4.1',
    description: 'Flagship GPT model for complex tasks',
    capabilities: {
      ...DEFAULT_CAPABILITIES,
      imageUpload: true,
      tooling: true,
    },
  },
  'gpt-4.1-mini': {
    provider: 'openai',
    id: 'gpt-4.1-mini',
    displayName: 'GPT 4.1 Mini',
    description: 'Balanced for intelligence, speed, and cost',
    capabilities: {
      ...DEFAULT_CAPABILITIES,
      imageUpload: true,
      tooling: true,
    },
  },
  'o4-mini': {
    provider: 'openai',
    id: 'o4-mini',
    displayName: 'o4 Mini',
    description: 'Faster, more affordable reasoning model',
    capabilities: {
      ...DEFAULT_CAPABILITIES,
      thinking: true,
      tooling: true,
    },
  },

  'gemini-2.5-flash': {
    provider: 'google',
    id: 'gemini-2.5-flash',
    displayName: 'Gemini 2.5 Flash',
    description: 'Cost efficiency',
    capabilities: {
      ...DEFAULT_CAPABILITIES,
      tooling: true,
      fileUpload: true,
      imageUpload: true,
    },
    providerOptions: {
      google: {
        thinkingConfig: {
          thinkingBudget: 0
        }
      }
    },
  },
  "gemini-2.5-flash-thinking": {
    provider: 'google',
    id: 'gemini-2.5-flash',
    displayName: 'Gemini 2.5 Flash (Thinking)',
    description: 'Adaptive thinking, cost efficiency',
    capabilities: {
      ...DEFAULT_CAPABILITIES,
      tooling: true,
      thinking: true,
      fileUpload: true,
      imageUpload: true,
    },
    providerOptions: {
      google: {
        thinkingConfig: {
          thinkingBudget: 4096
        }
      }
    },
  },
  'gemini-2.5-pro': {
    provider: 'google',
    id: 'gemini-2.5-pro',
    displayName: 'Gemini 2.5 Pro',
    description: 'Enhanced thinking and reasoning, multimodal understanding, advanced coding, and more',
    capabilities: {
      ...DEFAULT_CAPABILITIES,
      tooling: true,
      thinking: true,
      fileUpload: true,
      imageUpload: true,
    },
  },
  'llama4-scout': {
    provider: 'groq',
    id: 'meta-llama/llama-4-scout-17b-16e-instruct',
    displayName: 'Llama 4 Scout (Groq)',
    description: 'The latest Llama model, served by Groq',
    capabilities: {
      ...DEFAULT_CAPABILITIES,
      fileUpload: true,
      imageUpload: true,
      tooling: true,
    },
  },
  'qwen3-32b': {
    provider: 'groq',
    id: 'qwen/qwen3-32b',
    displayName: 'Qwen 3 32B (Groq)',
    description: 'A powerful open model from Alibaba Cloud',
    capabilities: {
      ...DEFAULT_CAPABILITIES,
      tooling: true,
    },
    providerOptions: {
      groq: {
        reasoningEffort: "none"
      }
    },
  },
  'qwen3-32b-thinking': {
    provider: 'groq',
    id: 'qwen/qwen3-32b',
    displayName: 'Qwen 3 32B (Thinking)',
    description: 'A powerful open model from Alibaba Cloud',
    capabilities: {
      ...DEFAULT_CAPABILITIES,
      thinking: true,
      tooling: true,
    },
    providerOptions: {
      groq: {
        reasoningEffort: "default"
      }
    },
  },
  'grok-3': {
    provider: 'xai',
    id: 'grok-3',
    displayName: 'Grok 3',
    description: "xAI's most capable model",
    capabilities: {
      ...DEFAULT_CAPABILITIES,
      tooling: true,
      fileUpload: true,
      imageUpload: true,
    },
  },
  'grok-3-mini': {
    provider: 'xai',
    id: 'grok-3-mini',
    displayName: 'Grok 3 Mini',
    description: 'A faster, more efficient Grok model',
    capabilities: {
      ...DEFAULT_CAPABILITIES,
      thinking: true,
      fileUpload: true,
      imageUpload: true,
      tooling: true,
    },
  },
} as const satisfies Record<string, ModelConfig>;

export type ModelKey = keyof typeof MODELS;

export type LanguageModelId = {
  [K in ModelKey]: `${(typeof MODELS)[K]['provider']}:${K}`
}[ModelKey];

// Helper functions
export function getModelConfig(modelKey: ModelKey): ModelConfig {
  return MODELS[modelKey];
}

export function getAvailableModels(): Array<{ key: ModelKey; config: ModelConfig }> {
  return Object.entries(MODELS).map(([key, config]) => ({
    key: key as ModelKey,
    config,
  }));
}

export function getModelsByCapability(capability: Capability): ModelKey[] {
  return Object.entries(MODELS)
    .filter(([, config]) => config.capabilities[capability])
    .map(([key]) => key as ModelKey);
}

export function validateModelSupport(modelKey: ModelKey, requiredCapability?: string): boolean {
  const config = getModelConfig(modelKey);

  if (!requiredCapability) {
    return true;
  }

  return config.capabilities[requiredCapability as keyof typeof config.capabilities] || false;
}