"use client";

import { branchChatAction } from "@/actions";
import { MemoizedMarkdown } from "@/components/memoized-markdown";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { IconButton } from "@/components/ui/icon-button";
import { Message as dbMessage } from "@/generated/prisma";
import { getAvailableModels, ModelKey, MODELS } from "@/lib/model-registry";
import { cn } from "@/lib/utils";
import { Message } from "ai";
import { ChevronDown, Clipboard, Pencil, RefreshCcw, Split, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useState, memo } from "react";
import { toast } from "sonner";

interface ChatMessageProps {
  message: Message;
  status: "submitted" | "streaming" | "ready" | "error";
  selectedModelKey: ModelKey;
  handleRegenerate: ({ messageId, modelKey }: { messageId: string; modelKey?: ModelKey }) => void;
  handleUserMessageSave: ({
    messageId,
    editedText
  }: {
    messageId: string;
    editedText: string;
  }) => void;
  handleUserMessageDelete: ({ messageId }: { messageId: string }) => void;
}

function WebSearchLoading() {
  return (
    <div className="flex flex-col gap-2 text-muted-foreground">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-primary/70 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <div className="w-2 h-2 bg-primary/70 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <div className="w-2 h-2 bg-primary/70 rounded-full animate-bounce" />
      </div>
      <span className="text-sm">Searching the web…</span>
    </div>
  );
}

function ChatMessage({
  message,
  status,
  handleRegenerate,
  handleUserMessageSave,
  handleUserMessageDelete
}: ChatMessageProps) {
  const router = useRouter();
  const availableModels = getAvailableModels();

  const modelsByProvider = useMemo(() => {
    const grouped: Record<string, Array<{ key: ModelKey; config: any }>> = {};
    availableModels.forEach(({ key, config }) => {
      const provider = config.provider;
      if (!grouped[provider]) grouped[provider] = [];
      grouped[provider].push({ key, config });
    });
    return grouped;
  }, [availableModels]);

  // Extract text content once
  const userText = message?.parts?.map((part) => (part.type === "text" ? part.text : "")).join("");

  // Local state for editing user messages
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(userText);

  // Keep editedText in sync when message changes (e.g., after save)
  useEffect(() => {
    setEditedText(userText);
  }, [userText]);

  const userCopyableText = userText;

  const handleSave = (editedText: string) => {
    if (userText === editedText) {
      setIsEditing(false);
      return;
    }
    handleUserMessageSave({ messageId: message.id!, editedText });
    setIsEditing(false);
  };

  if (message.role === "user") {
    if (isEditing) {
      return (
        <div className="flex justify-end">
          <div className="flex flex-col gap-2 max-w-2xl">
            <textarea
              className="w-full p-2 text-sm border border-primary/20 rounded-md resize-none"
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              rows={2}
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setEditedText(userText);
                }}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={() => handleSave(editedText!)}>
                Save
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex justify-end">
        <div className="flex flex-col gap-2 max-w-2xl group relative">
          <div className="px-4 py-2 rounded-2xl max-w-fit bg-background border">
            <p className="text-sm">{userText}</p>
          </div>
          <div className="flex flex-row-reverse items-center gap-x-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity absolute top-1/2 -translate-y-1/2 right-full">
            <IconButton
              variant="ghost"
              size="sm"
              icon={<Clipboard className="size-3.5" />}
              tooltip="Copy"
              className="hover:bg-background"
              onClick={() => {
                if (typeof navigator !== "undefined" && navigator.clipboard) {
                  navigator.clipboard.writeText(userCopyableText ?? "").catch(() => {});
                  toast.success("Copied to clipboard");
                }
              }}
            />
            <IconButton
              variant="ghost"
              size="sm"
              icon={<Pencil className="size-3.5" />}
              tooltip="Edit"
              className="hover:bg-background"
              onClick={() => setIsEditing(true)}
            />
            <IconButton
              variant="ghost"
              size="sm"
              icon={<Trash className="size-3.5" />}
              tooltip="Delete"
              className="hover:bg-background"
              onClick={() => handleUserMessageDelete({ messageId: message.id! })}
            />
          </div>
        </div>
      </div>
    );
  }

  let content = "";
  message?.parts?.forEach((part) => {
    if (part.type === "text") {
      content += part.text;
    }
  });

  // Gather plain-text parts once for copy / regenerate buttons
  const copyableText = useMemo(() => {
    return (
      message?.parts
        ?.filter((p) => p.type === "text")
        .map((p: any) => p.text)
        .join("") || ""
    );
  }, [message.parts]);

  /* Render every part (text + tool invocation) in correct order */
  const renderedParts = useMemo(() => {
    return message.parts?.map((part, idx) => {
      if (part.type === "text") {
        return <MemoizedMarkdown key={idx} content={part.text} id={`${message.id}-${idx}`} />;
      }

      if (part.type === "tool-invocation") {
        const { toolName, state } = part.toolInvocation;
        if (toolName === "webSearch") {
          if (state === "partial-call" || state === "call") {
            // show loader while the search tool is running
            return <WebSearchLoading key={idx} />;
          }
          // hide 'result' part – let the LLM's next text cover the answer
          return null;
        }
      }
      return null;
    });
  }, [message.parts, message.id]);

  return (
    <div className="flex justify-start flex-col group">
      <div className="flex flex-col gap-2 max-w-2xl">
        <div className="prose">{renderedParts}</div>
      </div>

      <div
        className={cn(
          "flex items-center gap-x-1 w-full grow justify-between text-muted-foreground opacity-0 transition-opacity",
          status === "submitted" || status === "streaming" ? "" : "group-hover:opacity-100"
        )}
      >
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <IconButton
                variant="ghost"
                size="sm"
                icon={
                  <div className="flex items-center gap-1">
                    <RefreshCcw className="size-3.5" />
                    <ChevronDown className="size-2.5" />
                  </div>
                }
                tooltip="Regenerate with model"
                className="hover:bg-background"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => handleRegenerate({ messageId: message.id! })}>
                <RefreshCcw />
                Retry
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {Object.entries(modelsByProvider).map(([provider, models]) => (
                <DropdownMenuSub key={provider}>
                  <DropdownMenuSubTrigger>
                    {provider.charAt(0).toUpperCase() + provider.slice(1)}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {models.map(({ key, config }) => (
                      <DropdownMenuItem
                        key={key}
                        onClick={() => handleRegenerate({ messageId: message.id!, modelKey: key })}
                      >
                        {config.displayName}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <IconButton
            variant="ghost"
            size="sm"
            icon={<Clipboard className="size-3.5" />}
            tooltip="Copy"
            onClick={() => {
              if (typeof navigator !== "undefined" && navigator.clipboard) {
                navigator.clipboard.writeText(copyableText ?? "").catch(() => {});
                toast.success("Copied to clipboard");
              }
            }}
            className="hover:bg-background"
          />
          <IconButton
            variant="ghost"
            size="sm"
            icon={<Split className="size-3.5" />}
            tooltip="Branching"
            onClick={() => {
              startTransition(async () => {
                const newChatId = await branchChatAction(message.id);
                router.push(`/chat/${newChatId}`);
              });
            }}
          />
        </div>
        {(() => {
          const metaSource =
            (Array.isArray(message.annotations) && message.annotations.length > 0
              ? message.annotations[0]
              : (message as unknown as dbMessage).metadata) || undefined;

          if (!metaSource) return null;

          const meta = metaSource as {
            model?: string;
            tokens?: number | null;
            durationMs?: number;
          };

          const modelName = MODELS[meta.model?.split(":")[1] as ModelKey]?.displayName;
          return (
            <div className="text-xs text-muted-foreground flex gap-2 ml-auto">
              {modelName && <span>{modelName}</span>}
              {meta.tokens != null && meta.durationMs != null && (
                <span>{Math.round(meta.tokens / (meta.durationMs / 1000))} tokens/s</span>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

export const MemoizedChatMessage = memo(ChatMessage);
