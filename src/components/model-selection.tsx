"use client";

import { Command, CommandItem, CommandList } from "@/components/ui/command";
import { GeminiIcon, Grok, Groq, OpenAI } from "@/lib/brand-icons";
import { getAvailableModels, ModelKey, MODELS } from "@/lib/model-registry";
import { Brain, Check, FileText, Image, ImagePlus } from "lucide-react";
import { useEffect, useRef } from "react";

interface ModelSelectionProps {
  selectedIndex: number;
  onSelect: (modelKey: ModelKey) => void;
  visible: boolean;
  currentModelKey: ModelKey;
  mode?: 'model' | 'regenerate';
  regenerateMessageId?: string | null;
}

function getProviderIcon(provider: string) {
  switch (provider) {
    case "google":
      return <GeminiIcon className="w-4 h-4" />;
    case "openai":
      return <OpenAI className="w-4 h-4" />;
    case "groq":
      return <Groq className="w-4 h-4" />;
    case "xai":
      return <Grok className="w-4 h-4" />;
    default:
      return null;
  }
}

export function ModelSelection({
  selectedIndex,
  onSelect,
  visible,
  currentModelKey,
  mode = 'model',
  regenerateMessageId
}: ModelSelectionProps) {
  const selectedItemRef = useRef<HTMLDivElement>(null);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [selectedIndex]);

  if (!visible) return null;

  const availableModels = getAvailableModels();

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 z-50">
      <Command className="rounded-lg border shadow-lg bg-background/95 backdrop-blur-sm">
        <div className="p-2 border-b">
          <h3 className="text-sm font-medium">
            {mode === 'regenerate' ? 'Select Model for Regeneration' : 'Select AI Model'}
          </h3>
        </div>
        <CommandList className="max-h-64 p-1">
          {availableModels.map((model, index) => {
            const config = MODELS[model.key];
            return (
              <CommandItem
                key={model.key}
                ref={index === selectedIndex ? selectedItemRef : null}
                onSelect={() => onSelect(model.key)}
                className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors ${
                  index === selectedIndex
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {getProviderIcon(config.provider)}
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{config.displayName}</span>
                      {config.description && (
                        <span className="text-xs text-muted-foreground">{config.description}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {config.capabilities.thinking && (
                      <Brain className="w-3 h-3 text-muted-foreground" aria-label="Thinking" />
                    )}
                    {config.capabilities.fileUpload && (
                      <FileText className="w-3 h-3 text-muted-foreground" aria-label="File Upload" />
                    )}
                    {config.capabilities.imageUpload && (
                      <Image className="w-3 h-3 text-muted-foreground" aria-label="Image Upload" />
                    )}
                    {config.capabilities.imageGeneration && (
                      <ImagePlus className="w-3 h-3 text-muted-foreground" aria-label="Image Generation" />
                    )}
                  </div>
                  {model.key === currentModelKey && (
                    <Check className="w-4 h-4 text-green-500" />
                  )}
                </div>
              </CommandItem>
            );
          })}

          <div className="px-3 py-1 text-xs text-muted-foreground border-t mt-1 pt-2">
            <div className="flex items-center justify-between">
              <span>Use ↑↓ to navigate, Enter to select, Esc to cancel</span>
              <span>{availableModels.length} models</span>
            </div>
          </div>
        </CommandList>
      </Command>
    </div>
  );
}