"use client";

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Textarea } from "@/components/ui/textarea";
import { isCapabilitySupported } from "@/lib/chat-settings";
import { ModelKey } from "@/lib/model-registry";
import { setSelectedModel, setWebSearch } from "@/lib/stores/chat";
import { UploadedAttachment } from "@/lib/types";
import { ChatStatus } from "@/types";
import { ArrowUp, File as FileIcon, Globe, Loader2, Paperclip, Square, X } from "lucide-react";
import Image from "next/image";
import { KeyboardEvent, MouseEvent, useMemo, useRef } from "react";
import { ModelSelector } from "./model-selector";

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
  webSearch: boolean;
  onFileUpload: (file: File) => void;
  uploadedAttachment: UploadedAttachment | null;
  onRemoveAttachment: () => void;
}

export function ChatInput({
  input,
  setInput,
  onSubmit,
  placeholder = "How can t0Chat help?",
  status,
  stop,
  webSearch,
  modelKey,
  onFileUpload,
  uploadedAttachment,
  onRemoveAttachment
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSubmitted = status === "submitted";
  const isStreaming = status === "streaming" || status !== "ready";

  const handleModelChange = (newModelKey: ModelKey) => {
    setSelectedModel(newModelKey);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onFileUpload(file);
      // Reset file input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const supportedFileTypes = useMemo(() => {
    const types: string[] = [];
    if (isCapabilitySupported(modelKey, "imageUpload")) {
      types.push("image/jpeg", "image/png");
    }
    if (isCapabilitySupported(modelKey, "fileUpload")) {
      types.push("application/pdf");
    }
    return types;
  }, [modelKey]);

  const canTooling = isCapabilitySupported(modelKey, "tooling");
  const canUploadAnything = supportedFileTypes.length > 0;
  const isSendDisabled = input.trim() === "";

  return (
    <div className="">
      <div className="max-w-2xl mx-auto p-4 lg:px-0">
        <div className="rounded-2xl p-2 border shadow-sm bg-background">
          {/* Top Part: Textarea */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!isStreaming || isSubmitted) {
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
                  if (!isSendDisabled) {
                    onSubmit(e);
                  }
                }
              }}
              autoFocus
            />
          </form>
          {/* Bottom Part: Buttons */}
          <div className="flex items-end justify-between">
            <div className="flex items-end gap-x-2">
              {canUploadAnything && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept={supportedFileTypes.join(",")}
                  />
                  {uploadedAttachment ? (
                    <div className="relative">
                      <div className="relative w-10 h-10 rounded-md rounded-bl-3xl group">
                        {uploadedAttachment.status === "uploading" ? (
                          <div className="absolute inset-0 bg-muted flex items-center justify-center rounded-md rounded-bl-xl">
                            <Loader2 className="h-5 w-5 animate-[spin_0.25s_linear_infinite]" />
                          </div>
                        ) : uploadedAttachment.contentType?.startsWith("image/") ? (
                          <Image
                            src={uploadedAttachment.url!}
                            alt={uploadedAttachment.name}
                            fill
                            className="rounded-md rounded-bl-xl object-cover peer data-image"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted rounded-md flex flex-col items-center justify-center text-xs text-center p-1">
                            <FileIcon className="w-5 h-5 mb-1" />
                            <span className="truncate">{uploadedAttachment.name}</span>
                          </div>
                        )}
                      </div>
                      {uploadedAttachment.status !== "uploading" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-destructive text-destructive-foreground opacity-0 group-data-image:opacity-100 transition-opacity duration-200"
                          onClick={onRemoveAttachment}
                        >
                          <X className="!h-3 !w-3" />
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-2xl"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip className="size-4" />
                      Attach file
                    </Button>
                  )}
                </>
              )}

              {canTooling && (
                <Button
                  variant={webSearch ? "default" : "outline"}
                  size="sm"
                  className="rounded-2xl"
                  onClick={() => setWebSearch(!webSearch)}
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
                className="h-8 w-8 rounded-full hover:bg-primary hover:text-primary-foreground"
                icon={
                  isSubmitted ? <Square className=" size-4" /> : <ArrowUp className=" size-5" />
                }
                tooltip="Send message"
                onClick={isSubmitted ? stop : onSubmit}
                variant={input.trim() === "" ? "outline" : "default"}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
