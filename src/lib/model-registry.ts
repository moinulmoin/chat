export type Capability = 'searchTool' | 'thinking' | 'fileUpload' | 'imageGeneration' | 'imageUpload';

export interface ModelConfig {
  provider: string;
  id: string;
  capabilities: Record<Capability, boolean>;
  providerOptions?: Record<string, any>;
  displayName: string;
  description?: string;
}

export const MODELS = {
  'gpt-4.1': {
    provider: 'openai',
    id: 'gpt-4.1',
    displayName: 'GPT-4.1',
    description: 'Flagship GPT model for complex tasks',
    capabilities: {
      searchTool: false,
      thinking: false,
      fileUpload: false,
      imageGeneration: false,
      imageUpload: true,
    },
  },
  'gpt-4.1-mini': {
    provider: 'openai',
    id: 'gpt-4.1-mini',
    displayName: 'GPT-4.1 Mini',
    description: 'Balanced for intelligence, speed, and cost',
    capabilities: {
      searchTool: false,
      thinking: false,
      fileUpload: false,
      imageGeneration: false,
      imageUpload: true,
    },
  },
  'o4-mini': {
    provider: 'openai',
    id: 'o4-mini',
    displayName: 'O4 Mini',
    description: 'Faster, more affordable reasoning model',
    capabilities: {
      searchTool: false,
      thinking: true,
      fileUpload: false,
      imageGeneration: false,
      imageUpload: true,
    },
  },

  'gemini-2.5-flash': {
    provider: 'google',
    id: 'gemini-2.5-flash-preview-05-20',
    displayName: 'Gemini 2.5 Flash',
    description: 'Cost efficiency',
    capabilities: {
      searchTool: true,
      thinking: false,
      fileUpload: true,
      imageGeneration: false,
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
    id: 'gemini-2.5-flash-preview-05-20',
    displayName: 'Gemini 2.5 Flash (Thinking)',
    description: 'Adaptive thinking, cost efficiency',
    capabilities: {
      searchTool: true,
      thinking: true,
      fileUpload: true,
      imageGeneration: false,
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
    id: 'gemini-2.5-pro-preview-06-05',
    displayName: 'Gemini 2.5 Pro',
    description: 'Enhanced thinking and reasoning, multimodal understanding, advanced coding, and more',
    capabilities: {
      searchTool: true,
      thinking: true,
      fileUpload: true,
      imageGeneration: false,
      imageUpload: true,
    },
  },
  'llama4-scout': {
    provider: 'groq',
    id: 'meta-llama/llama-4-scout-17b-16e-instruct',
    displayName: 'Llama 4 Scout (Groq)',
    description: 'The latest Llama model, served by Groq',
    capabilities: {
      searchTool: false,
      thinking: false,
      fileUpload: true,
      imageGeneration: false,
      imageUpload: true,
    },
  },
  'qwen3-32b': {
    provider: 'groq',
    id: 'qwen/qwen3-32b',
    displayName: 'Qwen 3 32B (Groq)',
    description: 'A powerful open model from Alibaba Cloud',
    capabilities: {
      searchTool: false,
      thinking: false,
      fileUpload: false,
      imageGeneration: false,
      imageUpload: false,
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
      searchTool: false,
      thinking: true,
      fileUpload: false,
      imageGeneration: false,
      imageUpload: false,
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
      searchTool: true,
      thinking: false,
      fileUpload: true,
      imageGeneration: false,
      imageUpload: true,
    },
  },
  'grok-3-mini': {
    provider: 'xai',
    id: 'grok-3-mini',
    displayName: 'Grok 3 Mini',
    description: 'A faster, more efficient Grok model',
    capabilities: {
      searchTool: false,
      thinking: true,
      fileUpload: true,
      imageGeneration: false,
      imageUpload: true,
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