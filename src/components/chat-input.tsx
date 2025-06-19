"use client";

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Textarea } from "@/components/ui/textarea";
import { isCapabilitySupported } from "@/lib/chat-settings";
import { ModelKey, MODELS } from "@/lib/model-registry";
import { setModelKey, toggleWebSearch } from "@/lib/stores/chat";
import { UploadedAttachment } from "@/lib/types";
import { ChatStatus } from "@/types";
import { FileText, Loader2, Square, X, Circle } from "lucide-react";
import Image from "next/image";
import { KeyboardEvent, MouseEvent, useMemo, useRef, useState, useCallback } from "react";
import { CommandSuggestions } from "./command-suggestions";
import { ModelSelection } from "./model-selection";
import { 
  getCommandSuggestions, 
  executeSlashCommand,
  SlashCommand,
  CommandContext 
} from "@/lib/slash-commands";
import { getAvailableModels } from "@/lib/model-registry";
import { useRouter } from "next/navigation";
import { useMessageCount } from "@/hooks/use-message-count";
import { toast } from "sonner";

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
  chatId?: string;
  setHistoryOpen: (open: boolean) => void;
}

export function ChatInput({
  input,
  setInput,
  onSubmit,
  status,
  stop,
  webSearch,
  modelKey,
  onFileUpload,
  uploadedAttachment,
  onRemoveAttachment,
  chatId,
  setHistoryOpen
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { count: messageCount } = useMessageCount(chatId);

  // Slash command state
  const [showCommandSuggestions, setShowCommandSuggestions] = useState(false);
  const [commandSuggestions, setCommandSuggestions] = useState<SlashCommand[]>([]);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  
  // Model selection state
  const [showModelSelection, setShowModelSelection] = useState(false);
  const [selectedModelIndex, setSelectedModelIndex] = useState(0);
  
  // Active command state
  const [activeCommand, setActiveCommand] = useState<string | null>(null);

  const isSubmitted = status === "submitted";
  const isStreaming = status === "streaming" || status !== "ready";

  const handleModelChange = (newModelKey: ModelKey) => {
    setModelKey(newModelKey);
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

  // Slash command detection
  const detectSlashCommand = useCallback((value: string) => {
    if (value.startsWith('/')) {
      if (value === '/') {
        // Show all commands when user types just "/"
        const suggestions = getCommandSuggestions('', isStreaming, messageCount);
        setCommandSuggestions(suggestions);
        setShowCommandSuggestions(true);
        setSelectedCommandIndex(0);
      } else if (value.length > 1) {
        const query = value.slice(1).toLowerCase().split(' ')[0];
        const suggestions = getCommandSuggestions(query, isStreaming, messageCount);
        setCommandSuggestions(suggestions);
        setShowCommandSuggestions(suggestions.length > 0);
        setSelectedCommandIndex(0);
      }
    } else {
      setShowCommandSuggestions(false);
      setCommandSuggestions([]);
    }
  }, [isStreaming, messageCount]);

  // Execute slash command
  const executeCommand = useCallback(async (input: string) => {
    const context: CommandContext = {
      router,
      chatId,
      setHistoryOpen,
      setInput,
      messageCount,
      setShowModelSelection,
      stop,
      isStreaming,
      onFileUpload,
      supportedFileTypes,
      setActiveCommand,
      setShowCommandSuggestions
    };

    const result = await executeSlashCommand(input, context);
    
    if (!result.success) {
      toast.error(result.message || "Command execution failed");
    }
  }, [router, chatId, setHistoryOpen, setInput, messageCount, stop, isStreaming, onFileUpload, supportedFileTypes, setActiveCommand, setShowCommandSuggestions]);

  // Handle input changes
  const handleInputChange = useCallback((value: string) => {
    // Special handling for /web command
    if (activeCommand === 'web' && value !== '/web ' && !value.startsWith('/web ')) {
      // User started typing something after /web, execute web command and clear
      toggleWebSearch();
      setActiveCommand(null);
      setShowCommandSuggestions(false);
      setInput(value.startsWith('/') ? '' : value);
      return;
    }
    
    setInput(value);
    detectSlashCommand(value);
    
    // Clear active command if input is cleared or doesn't start with /
    if (!value.startsWith('/') || value === '/') {
      setActiveCommand(null);
    }
  }, [setInput, detectSlashCommand, activeCommand]);

  // Handle command suggestion selection
  const selectCommand = useCallback((command: SlashCommand) => {
    if (command.command === 'model') {
      // Show model selection instead of completing the command
      setActiveCommand('model');
      setShowModelSelection(true);
      setShowCommandSuggestions(false);
      setSelectedModelIndex(0);
      setInput('/model');
    } else {
      setActiveCommand(command.command);
      setInput(`/${command.command} `);
      setShowCommandSuggestions(false);
    }
  }, [setInput]);

  // Handle model selection
  const selectModel = useCallback((modelKey: ModelKey) => {
    handleModelChange(modelKey);
    setShowModelSelection(false);
    setActiveCommand(null);
    setInput('');
  }, [handleModelChange]);

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

  const canUploadAnything = supportedFileTypes.length > 0;
  const isSendDisabled = input.trim() === "";

  return (
    <div className="">
      <div className="max-w-2xl mx-auto p-4 lg:px-0">
        <div className="relative">
          {/* Command Suggestions Overlay */}
          <CommandSuggestions
            commands={commandSuggestions}
            selectedIndex={selectedCommandIndex}
            onSelect={selectCommand}
            visible={showCommandSuggestions}
          />
          
          {/* Model Selection Overlay */}
          <ModelSelection
            selectedIndex={selectedModelIndex}
            onSelect={selectModel}
            visible={showModelSelection}
            currentModelKey={modelKey}
          />
          
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
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Type a message or use '/' for commands..."
              className={`w-full resize-none border-0 p-2 shadow-none bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0 h-auto ${
                activeCommand ? 'font-mono' : ''
              }`}
              rows={1}
              onKeyDown={(e) => {
                // Handle model selection navigation
                if (showModelSelection) {
                  const availableModels = getAvailableModels();
                  if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
                    e.preventDefault();
                    const selectedModel = availableModels[selectedModelIndex];
                    selectModel(selectedModel.key);
                    return;
                  }
                  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    const direction = e.key === 'ArrowUp' ? -1 : 1;
                    setSelectedModelIndex(prev => 
                      Math.max(0, Math.min(availableModels.length - 1, prev + direction))
                    );
                    return;
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    setShowModelSelection(false);
                    setInput('');
                    return;
                  }
                }

                // Handle command suggestions navigation
                if (showCommandSuggestions) {
                  if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
                    e.preventDefault();
                    const selectedCmd = commandSuggestions[selectedCommandIndex];
                    selectCommand(selectedCmd);
                    return;
                  }
                  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    const direction = e.key === 'ArrowUp' ? -1 : 1;
                    setSelectedCommandIndex(prev => 
                      Math.max(0, Math.min(commandSuggestions.length - 1, prev + direction))
                    );
                    return;
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    setShowCommandSuggestions(false);
                    return;
                  }
                }

                // Check for slash command execution
                if (e.key === 'Enter' && !e.shiftKey && input.startsWith('/')) {
                  e.preventDefault();
                  executeCommand(input);
                  return;
                }

                // Regular message sending
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
              {canUploadAnything && uploadedAttachment && (
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept={supportedFileTypes.join(",")}
                />
              )}
              {uploadedAttachment && (
                <div className="relative group flex flex-col items-center">
                  <div className="relative w-10 h-10 rounded-md rounded-bl-3xl">
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
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    {uploadedAttachment.status !== "uploading" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive hover:text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        onClick={onRemoveAttachment}
                      >
                        <X className="!h-3 !w-3" />
                      </Button>
                    )}
                  </div>
                  {uploadedAttachment.status !== "uploading" && (
                    <div className="text-xs text-center mt-1 max-w-20 truncate font-mono">
                      {uploadedAttachment.name}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* Status indicator */}
              <div className="flex items-center">
                <Circle 
                  className={`w-2 h-2 ${
                    status === 'streaming' ? 'fill-yellow-500 text-yellow-500' :
                    status === 'error' ? 'fill-red-500 text-red-500' :
                    'fill-green-500 text-green-500'
                  }`} 
                />
              </div>
              <div className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded-md">
                {MODELS[modelKey].displayName}
              </div>
              {isSubmitted && (
                <IconButton
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-primary hover:text-primary-foreground"
                  icon={<Square className=" size-4" />}
                  tooltip="Stop"
                  onClick={stop}
                  variant="default"
                />
              )}
            </div>
          </div>
        </div>
        </div>
        
        {/* Branding text */}
        <div className="text-center mt-2">
          <p className="text-xs text-muted-foreground">
            Brought to you by <span className="font-mono font-medium">cmdchat</span>
          </p>
        </div>
      </div>
    </div>
  );
}
