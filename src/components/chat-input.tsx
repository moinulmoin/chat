"use client";

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Textarea } from "@/components/ui/textarea";
import { isCapabilitySupported } from "@/lib/chat-settings";
import { ModelKey } from "@/lib/model-registry";
import { ChatStatus } from "@/types";
import { ArrowUp, Globe, Paperclip, Square } from "lucide-react";
import { KeyboardEvent, MouseEvent } from "react";
import { ModelSelector } from "./model-selector";
import { useStore } from "@nanostores/react";
import { chatStore, toggleWebSearch } from "@/lib/stores/chat";

interface ChatInputProps {
  onSubmit: (
    e:
      | React.FormEvent<HTMLFormElement>
      | KeyboardEvent<HTMLTextAreaElement>
      | MouseEvent<HTMLButtonElement>
  ) => void;
  placeholder?: string;
  status: ChatStatus;
  stop: () => void;
  input: string;
  setInput: (input: string) => void;
  modelKey: ModelKey;
  onModelChange?: (modelKey: ModelKey) => void;
}

export function ChatInput({
  input,
  setInput,
  onSubmit,
  placeholder = "How can t0Chat help?",
  status,
  stop,
  modelKey,
  onModelChange,
}: ChatInputProps) {
  const isLoading = status === "submitted";
  const isDisabled = status === "streaming" || status !== "ready";
  const { webSearch } = useStore(chatStore);

  const handleModelChange = (newModelKey: ModelKey) => {
    onModelChange?.(newModelKey);
  };

  const canTooling = isCapabilitySupported(modelKey, "tooling");
  const canUploadFile = isCapabilitySupported(modelKey, "fileUpload");
  const canGenerateImage = isCapabilitySupported(modelKey, "imageGeneration");
  const canUploadImage = isCapabilitySupported(modelKey, "imageUpload");

  return (
    <div className="p-4">
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl p-2 border shadow-sm bg-background">
          {/* Top Part: Textarea */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!isDisabled || isLoading) {
                onSubmit(e);
              }
            }}
            className="flex-1"
          >
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholder}
              className="w-full resize-none border-0 p-2 shadow-none bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0 h-auto"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!isDisabled || isLoading) {
                    onSubmit(e);
                  }
                }
              }}
              autoFocus
            />
          </form>
          {/* Bottom Part: Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-2">
              <IconButton
                variant="outline"
                size="icon"
                className="h-8 w-8 flex-shrink-0 rounded-full hover:bg-secondary"
                icon={<Paperclip className="size-4" />}
                tooltip={canUploadFile ? "Attach file" : "File upload not supported by this model"}
                disabled={!canUploadFile}
              />

              {canTooling && (
                <Button
                  variant={webSearch ? "default" : "outline"}
                  size="sm"
                  className="rounded-2xl"
                  onClick={() => toggleWebSearch(!webSearch)}
                >
                  <Globe size={14} className="" />
                  Search
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <ModelSelector modelKey={modelKey} onModelChange={handleModelChange} />
              <IconButton
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-secondary"
                icon={isLoading ? <Square className=" size-4" /> : <ArrowUp className=" size-5" />}
                tooltip="Send message"
                onClick={isLoading ? stop : onSubmit}
                variant={isLoading ? "default" : "outline"}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
