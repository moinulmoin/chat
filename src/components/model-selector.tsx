"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ModelKey, MODELS } from "@/lib/model-registry";
import { modelsProvider } from "@/lib/utils";
import { Brain, Check, ChevronDown, File, FileText, Globe, Image, ImagePlus, Rocket, Sparkles, Wind, Zap } from "lucide-react";
import * as React from "react";

interface ModelSelectorProps {
  modelKey: ModelKey;
  onModelChange: (modelKey: ModelKey) => void;
}

const getProviderIcon = (provider: string) => {
  switch (provider) {
    case "google":
      return <Sparkles className="size-4" />;
    case "openai":
      return <Zap className="size-4" />;
    case "groq":
      return <Rocket className="size-4" />;
    case "xai":
        return <Wind className="size-4" />;
    default:
      return null;
  }
};

export function ModelSelector({ modelKey, onModelChange }: ModelSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const currentModel = modelsProvider.availableModels.find(
    (m) => m.key === modelKey
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="rounded-2xl">
          {currentModel?.label || modelsProvider.model}
          <ChevronDown size={16} className="ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-80" align="end">
        <Command>
          <CommandInput placeholder="Search models..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {modelsProvider.availableModels.map((model) => (
                <CommandItem
                  key={model.key}
                  onSelect={() => {
                    onModelChange(model.key);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {getProviderIcon(MODELS[model.key].provider)}
                    <span>{model.label}</span>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5">
                    {MODELS[model.key].capabilities.searchTool && (
                      <Globe className="size-4 text-muted-foreground" />
                    )}
                    {MODELS[model.key].capabilities.thinking && (
                      <Brain className="size-4 text-muted-foreground" />
                    )}
                    {MODELS[model.key].capabilities.fileUpload && (
                      <FileText className="size-4 text-muted-foreground" />
                    )}
                    {MODELS[model.key].capabilities.imageUpload && (
                      <Image className="size-4 text-muted-foreground" />
                    )}
                    {MODELS[model.key].capabilities.imageGeneration && (
                        <ImagePlus className="size-4 text-muted-foreground" />
                    )}
                    {model.key === modelKey && <Check className="ml-2 size-4" />}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}