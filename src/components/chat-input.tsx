"use client";

import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Textarea } from "@/components/ui/textarea";
import { useMessageCount } from "@/hooks/use-message-count";
import { isCapabilitySupported } from "@/lib/chat-settings";
import { getAvailableModels, ModelKey, MODELS } from "@/lib/model-registry";
import {
  CommandContext,
  executeSlashCommand,
  getCommandSuggestions,
  SlashCommand
} from "@/lib/slash-commands";
import { setModelKey } from "@/lib/stores/chat";
import { UploadedAttachment } from "@/lib/types";
import { ChatStatus } from "@/types";
import { Circle, FileText, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { KeyboardEvent, MouseEvent, useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { CommandSuggestions } from "./command-suggestions";
import { ModelSelection } from "./model-selection";

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
  // Unified message selection props
  selectionMode?: 'select' | null;
  selectedMessageIndex?: number;
  setSelectionMode?: (mode: 'select' | null) => void;
  setSelectedMessageIndex?: (index: number) => void;
  messages?: any[];
  // Message action handlers
  handleUserMessageDelete?: ({ messageId }: { messageId: string }) => void;
  handleUserMessageSave?: ({ messageId, editedText }: { messageId: string; editedText: string }) => void;
  handleRegenerate?: ({ messageId, modelKey }: { messageId: string; modelKey?: any }) => void;
  // Inline editing state
  setIsInlineEditing?: (editing: boolean) => void;
  setEditingMessageId?: (messageId: string | null) => void;
  exitEditingMode?: () => void;
  // Model selection for regenerate
  regenerateMode?: string | null;
  setRegenerateMode?: (messageId: string | null) => void;
  // Toggle handlers for AI message sections
  handleToggleSources?: ({ messageId }: { messageId: string }) => void;
  handleToggleThinking?: ({ messageId }: { messageId: string }) => void;
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
  setHistoryOpen,
  selectionMode,
  selectedMessageIndex,
  setSelectionMode,
  setSelectedMessageIndex,
  messages,
  handleUserMessageDelete,
  handleUserMessageSave,
  handleRegenerate,
  setIsInlineEditing,
  setEditingMessageId,
  exitEditingMode,
  regenerateMode,
  setRegenerateMode,
  handleToggleSources,
  handleToggleThinking
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
  const detectSlashCommand = useCallback(
    (value: string) => {
      if (value.startsWith("/")) {
        if (value === "/") {
          // Show all commands when user types just "/"
          const selectedMessage = messages && selectedMessageIndex !== undefined && selectedMessageIndex >= 0 && selectedMessageIndex < messages.length
            ? messages[selectedMessageIndex]
            : undefined;
          const suggestions = getCommandSuggestions("", isStreaming, messageCount, selectionMode, selectedMessage);
          setCommandSuggestions(suggestions);
          setShowCommandSuggestions(true);
          setSelectedCommandIndex(0);
        } else if (value.length > 1) {
          const query = value.slice(1).toLowerCase().split(" ")[0];
          const selectedMessage = messages && selectedMessageIndex !== undefined && selectedMessageIndex >= 0 && selectedMessageIndex < messages.length
            ? messages[selectedMessageIndex]
            : undefined;
          const suggestions = getCommandSuggestions(query, isStreaming, messageCount, selectionMode, selectedMessage);
          setCommandSuggestions(suggestions);
          setShowCommandSuggestions(suggestions.length > 0);
          setSelectedCommandIndex(0);
        }
      } else {
        setShowCommandSuggestions(false);
        setCommandSuggestions([]);
      }
    },
    [isStreaming, messageCount, selectionMode, selectedMessageIndex, messages]
  );

  // Execute slash command
  const executeCommand = useCallback(
    async (input: string) => {
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
        setShowCommandSuggestions,
        setSelectionMode,
        setSelectedMessageIndex,
        selectedMessageIndex,
        messages,
        handleUserMessageDelete,
        handleRegenerate,
        setRegenerateMode,
        handleToggleSources,
        handleToggleThinking
      };

      const result = await executeSlashCommand(input, context);

      if (!result.success) {
        toast.error(result.message || "Command execution failed");
      }
    },
    [
      router,
      chatId,
      setHistoryOpen,
      setInput,
      messageCount,
      stop,
      isStreaming,
      onFileUpload,
      supportedFileTypes,
      setActiveCommand,
      setShowCommandSuggestions,
      setSelectionMode,
      setSelectedMessageIndex,
      selectedMessageIndex,
      messages,
      handleUserMessageDelete,
      handleRegenerate,
      setRegenerateMode,
      handleToggleSources,
      handleToggleThinking
    ]
  );

  // Handle input changes
  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value);
      detectSlashCommand(value);

      // Clear active command if input is cleared or doesn't start with /
      if (!value.startsWith("/") || value === "/") {
        setActiveCommand(null);
      }
    },
    [setInput, detectSlashCommand]
  );

  // Handle command suggestion selection
  const selectCommand = useCallback(
    (command: SlashCommand) => {
      if (command.command === "model") {
        // Show model selection instead of completing the command
        setActiveCommand("model");
        setShowModelSelection(true);
        setShowCommandSuggestions(false);
        setSelectedModelIndex(0);
        setInput("/model");
      } else if (command.command === "regenerate") {
        // Show model selection for regenerate if no args
        setActiveCommand("regenerate");
        setShowCommandSuggestions(false);
        setInput(`/${command.command} `);

        // Trigger the regenerate command immediately to show model selection
        setTimeout(() => {
          executeCommand(`/${command.command}`);
        }, 0);
      } else {
        setActiveCommand(command.command);
        setInput(`/${command.command} `);
        setShowCommandSuggestions(false);

        // For immediate execution commands in selection mode, execute them
        if (selectionMode === 'select' && ['copy', 'delmsg', 'branch', 'togglesources', 'togglethinking'].includes(command.command)) {
          setTimeout(() => {
            executeCommand(`/${command.command}`);
          }, 0);
        }
      }
    },
    [setInput, selectionMode, executeCommand]
  );

  // Handle model selection
  const selectModel = useCallback(
    (modelKey: ModelKey) => {
      if (regenerateMode && handleRegenerate) {
        // Regenerate mode: use selected model to regenerate the message
        handleRegenerate({ messageId: regenerateMode, modelKey });
        setRegenerateMode && setRegenerateMode(null);
        setSelectionMode && setSelectionMode(null);
        setShowModelSelection(false);
        setActiveCommand(null);
        setInput("");
        toast.success(`Regenerating with ${MODELS[modelKey].displayName}...`);
      } else {
        // Regular model selection: switch current model
        handleModelChange(modelKey);
        setShowModelSelection(false);
        setActiveCommand(null);
        setInput("");
      }
    },
    [handleModelChange, regenerateMode, handleRegenerate, setRegenerateMode, setSelectionMode]
  );

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
            mode={regenerateMode ? 'regenerate' : 'model'}
            regenerateMessageId={regenerateMode}
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
                  activeCommand ? "font-mono" : ""
                }`}
                rows={1}
                              onKeyDown={(e) => {
                                // Handle model selection navigation (HIGHEST PRIORITY)
                if (showModelSelection) {
                    const availableModels = getAvailableModels();
                    if (e.key === "Tab" || (e.key === "Enter" && !e.shiftKey)) {
                      e.preventDefault();
                      const selectedModel = availableModels[selectedModelIndex];
                      selectModel(selectedModel.key);
                      return;
                    }
                    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                      e.preventDefault();
                      const direction = e.key === "ArrowUp" ? -1 : 1;
                      setSelectedModelIndex((prev) =>
                        Math.max(0, Math.min(availableModels.length - 1, prev + direction))
                      );
                      return;
                    }
                    if (e.key === "Escape") {
                      e.preventDefault();
                      setShowModelSelection(false);
                      setInput("");
                      return;
                    }
                  }

                  // Handle command suggestions navigation
                  if (showCommandSuggestions) {
                    if (e.key === "Tab") {
                      e.preventDefault();
                      const selectedCmd = commandSuggestions[selectedCommandIndex];
                      if (selectedCmd) {
                        // Tab auto-completes the command
                        setInput(`/${selectedCmd.command} `);
                        setShowCommandSuggestions(false);
                        setActiveCommand(selectedCmd.command);
                      }
                      return;
                    }
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      const selectedCmd = commandSuggestions[selectedCommandIndex];
                      selectCommand(selectedCmd);
                      return;
                    }
                    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                      e.preventDefault();
                      const direction = e.key === "ArrowUp" ? -1 : 1;
                      setSelectedCommandIndex((prev) =>
                        Math.max(0, Math.min(commandSuggestions.length - 1, prev + direction))
                      );
                      return;
                    }
                    if (e.key === "Escape") {
                      e.preventDefault();
                      setShowCommandSuggestions(false);
                      return;
                    }
                  }

                  // Handle message selection navigation (LOWEST PRIORITY)
                  if (selectionMode === 'select') {
                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                      e.preventDefault();
                      if (!messages || messages.length === 0) return;

                      const direction = e.key === 'ArrowUp' ? -1 : 1;
                      const currentIndex = selectedMessageIndex ?? messages.length - 1;

                      // Wrap around navigation: top wraps to bottom, bottom wraps to top
                      let newIndex = currentIndex + direction;
                      if (newIndex < 0) {
                        newIndex = messages.length - 1; // Wrap to last message
                      } else if (newIndex >= messages.length) {
                        newIndex = 0; // Wrap to first message
                      }

                      if (setSelectedMessageIndex) {
                        setSelectedMessageIndex(newIndex);

                        // Scroll selected message into view
                        setTimeout(() => {
                          const messageElements = document.querySelectorAll('[data-message-index]');
                          const selectedElement = Array.from(messageElements).find(
                            el => el.getAttribute('data-message-index') === newIndex.toString()
                          );
                          if (selectedElement) {
                            selectedElement.scrollIntoView({
                              behavior: 'smooth',
                              block: 'center'
                            });
                          }
                        }, 50);
                      }
                      return;
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      if (setSelectionMode) setSelectionMode(null);
                      toast.success("Exited selection mode");
                      return;
                    }
                    // Allow typing commands while in selection mode
                    if (e.key === 'Enter' && !e.shiftKey && input.startsWith('/')) {
                      e.preventDefault();
                      executeCommand(input);
                      return;
                    }
                  }

                  // Check for slash command execution
                  if (e.key === "Enter" && !e.shiftKey && input.startsWith("/")) {
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
                {canUploadAnything && (
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept={supportedFileTypes.join(",")}
                  />
                )}
              </div>

              <div className="flex items-center space-x-2">
                {/* Status indicator */}
                <div className="flex items-center">
                  <Circle
                    className={`w-2 h-2 ${
                      status === "streaming"
                        ? "fill-yellow-500 text-yellow-500"
                        : status === "error"
                        ? "fill-red-500 text-red-500"
                        : "fill-green-500 text-green-500"
                    }`}
                  />
                </div>

                              {/* Uploaded attachment display - horizontal layout */}
              {uploadedAttachment && uploadedAttachment.contentType?.startsWith("image/") ? (
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <div className="flex items-center space-x-2 text-xs font-mono bg-muted px-2 py-1 rounded-md relative group hover:bg-muted/80 transition-colors cursor-help">
                      {uploadedAttachment.status === "uploading" ? (
                        <Loader2 className="h-4 w-4 animate-[spin_0.25s_linear_infinite]" />
                      ) : (
                        <div className="relative w-4 h-4">
                          <Image
                            src={uploadedAttachment.url!}
                            alt={uploadedAttachment.name}
                            fill
                            className="rounded object-cover"
                          />
                        </div>
                      )}

                      <span className="text-muted-foreground max-w-32">
                        {uploadedAttachment.name}
                      </span>

                      {/* Remove button - shows on hover over entire badge */}
                      {uploadedAttachment.status !== "uploading" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0"
                          onClick={onRemoveAttachment}
                        >
                          <X className="!h-2 !w-2" />
                        </Button>
                      )}
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-auto p-2" side="top">
                    <div className="space-y-2">
                      <div className="relative h-32">
                        <Image
                          src={uploadedAttachment.url!}
                          alt={uploadedAttachment.name}
                          fill
                          className="rounded object-contain"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-center font-mono">
                        {uploadedAttachment.name}
                      </p>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              ) : uploadedAttachment ? (
                <div className="flex items-center space-x-2 text-xs font-mono bg-muted px-2 py-1 rounded-md relative group hover:bg-muted/80 transition-colors">
                  {uploadedAttachment.status === "uploading" ? (
                    <Loader2 className="h-4 w-4 animate-[spin_0.25s_linear_infinite]" />
                  ) : (
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  )}

                  <span className="text-muted-foreground max-w-32">
                    {uploadedAttachment.name}
                  </span>

                  {/* Remove button - shows on hover over entire badge */}
                  {uploadedAttachment.status !== "uploading" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0"
                      onClick={onRemoveAttachment}
                    >
                      <X className="!h-2 !w-2" />
                    </Button>
                  )}
                </div>
              ) : null}

                {webSearch && (
                  <div className="text-xs text-blue-600 font-mono bg-blue-100 px-2 py-1 rounded-md animate-pulse">
                    Web Search
                  </div>
                )}
                                            {/* Selection mode indicator */}
              {selectionMode === 'select' && messages && selectedMessageIndex !== undefined && selectedMessageIndex >= 0 && selectedMessageIndex < messages.length && (
                <div className="text-xs text-blue-600 font-mono bg-blue-100 px-2 py-1 rounded-md">
                  {selectedMessageIndex + 1} of {messages.length}
                </div>
              )}

              <div className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded-md">
                {MODELS[modelKey].displayName}
              </div>
              </div>
            </div>
          </div>
        </div>

        {/* Branding text */}
        <div className="text-center mt-2">
          <p className="text-xs text-muted-foreground">
            Brought to you by <span className="font-mono font-medium">/chat</span>
          </p>
        </div>
      </div>
    </div>
  );
}
