"use client";

import { branchChatAction } from "@/actions";
import { MemoizedMarkdown } from "@/components/memoized-markdown";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
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
import { GeminiIcon, Grok, Groq, OpenAI } from "@/lib/brand-icons";
import { getAvailableModels, ModelKey, MODELS } from "@/lib/model-registry";
import { cn } from "@/lib/utils";
import { Attachment, Message } from "ai";
import {
  ChevronDown,
  ChevronRight,
  Clipboard,
  ExternalLink,
  FileText,
  Pencil,
  RefreshCcw,
  Split,
  Trash
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { memo, startTransition, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";

interface ChatMessageProps {
  message: Message;
  messageNumber: number;
  messageIndex: number;
  isSelected?: boolean;
  isEditing?: boolean;
  selectionMode?: 'select' | null;
  availableActions?: string[];
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
  exitEditingMode?: () => void;
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

function ThinkingDots() {
  const [dots, setDots] = useState('.');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '.') return '..';
        if (prev === '..') return '...';
        return '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return <span className="inline-block w-4 text-left">{dots}</span>;
}

const getProviderIcon = (provider: string) => {
  switch (provider) {
    case "google":
      return <GeminiIcon className="size-4 mr-2" />;
    case "openai":
      return <OpenAI className="size-4 mr-2" />;
    case "groq":
      return <Groq className="size-4 mr-2" />;
    case "xai":
      return <Grok className="size-4 mr-2" />;
    default:
      return null;
  }
};

function ChatMessage({
  message,
  messageNumber,
  messageIndex,
  isSelected,
  isEditing,
  selectionMode,
  availableActions,
  status,
  handleRegenerate,
  handleUserMessageSave,
  handleUserMessageDelete,
  exitEditingMode
}: ChatMessageProps) {
  console.log(message);
  const router = useRouter();
  const { mutate } = useSWRConfig();
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
  const [editedText, setEditedText] = useState(userText);

  // Keep editedText in sync when message changes (e.g., after save)
  useEffect(() => {
    setEditedText(userText);
  }, [userText]);

  const userCopyableText = userText;

  const handleSave = (editedText: string) => {
    if (userText === editedText) {
      if (exitEditingMode) exitEditingMode();
      return;
    }
    handleUserMessageSave({ messageId: message.id!, editedText });
    if (exitEditingMode) exitEditingMode();
  };

  const attachments =
    message.experimental_attachments ||
    (message as unknown as dbMessage & { attachments: Attachment[] }).attachments ||
    [];

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

  // Extract web search results for sources display
  const webSearchResults = useMemo(() => {
    const results: Array<{ title: string; url: string; content: string }> = [];

    message.parts?.forEach((part) => {
      if (part.type === "tool-invocation" &&
          part.toolInvocation.toolName === "webSearch" &&
          part.toolInvocation.state === "result" &&
          Array.isArray(part.toolInvocation.result)) {
        results.push(...part.toolInvocation.result);
      }
    });

    return results;
  }, [message.parts]);

  if (message.role === "user") {
    if (isEditing) {
      return (
        <div className="flex justify-end" data-message-index={messageIndex}>
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
                  if (exitEditingMode) exitEditingMode();
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
      <div className="flex justify-end" data-message-index={messageIndex}>
        <div className={`flex flex-col gap-2 max-w-2xl group relative items-end ${
          isSelected ? 'ring-2 ring-yellow-400 ring-opacity-50 rounded-lg p-2 bg-yellow-50/50' : ''
        }`}>
                    {/* Message number badge - only show when selected or in selection mode */}
          {(isSelected || selectionMode === 'select') && (
            <div className={`text-xs font-mono px-2 py-1 rounded-md self-end transition-all ${
              isSelected
                ? 'bg-yellow-200 text-yellow-800'
                : 'text-muted-foreground/70 bg-muted/50'
            }`}>
              U-{messageNumber}
              {isSelected && availableActions && (
                <span className="ml-2 text-xs">
                  Available: /{availableActions.join(', /')}
                </span>
              )}
            </div>
          )}
          <div className="px-4 py-2 rounded-2xl max-w-fit bg-background border">
            <p className="text-sm">{userText}</p>
          </div>
          {attachments.length > 0 && (
            <div className="">
              {attachments.map((att, idx) =>
                att.contentType?.startsWith("image/") ? (
                  <div key={idx}>
                    <Image
                      src={att.url}
                      alt={att.name || "attached image"}
                      className=" object-cover rounded-xl"
                      width={100}
                      height={100}
                    />
                  </div>
                ) : (
                  <div
                    key={idx}
                    className="flex flex-col items-center gap-2 rounded-md border bg-muted p-2 text-sm"
                  >
                    <FileText className="size-10" />
                    <span className="text-sm truncate">{att.name}</span>
                  </div>
                )
              )}
            </div>
          )}
          <div className="flex flex-row-reverse items-center gap-x-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity absolute top-0 mt-1 mr-1 right-full">
            <IconButton
              variant="ghost"
              size="sm"
              icon={<Clipboard className="size-3.5" />}
              tooltip="Copy"
              onClick={() => {
                if (typeof navigator !== "undefined" && navigator.clipboard) {
                  navigator.clipboard.writeText(userCopyableText ?? "").catch(() => {});
                  toast.success("Copied to clipboard");
                }
              }}
              className="hover:bg-background"
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

  return (
    <div className="flex justify-start flex-col group" data-role="assistant" data-message-index={messageIndex}>
      <div className={`flex flex-col gap-2 max-w-2xl ${
        isSelected ? 'ring-2 ring-yellow-400 ring-opacity-50 rounded-lg p-2 bg-yellow-50/50' : ''
      }`}>
                {/* Message number badge - only show when selected or in selection mode */}
        {(isSelected || selectionMode === 'select') && (
          <div className={`text-xs font-mono px-2 py-1 rounded-md self-start transition-all ${
            isSelected
              ? 'bg-yellow-200 text-yellow-800'
              : 'text-muted-foreground/70 bg-muted/50'
          }`}>
            A-{messageNumber}
            {isSelected && availableActions && (
              <span className="ml-2 text-xs">
                Available: /{availableActions.join(', /')}
              </span>
            )}
          </div>
        )}
        {/* Show reasoning/thinking section for assistant messages */}
        {(() => {
          const reasoningParts = message.parts?.filter((part: any) => part.type === "reasoning");
          if (!reasoningParts || reasoningParts.length === 0) return null;

          const isThinking = status === "streaming";
          const thinkingLabel = isThinking ? "Thinking" : "Thoughts";

          return (
            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group/trigger">
                <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]/trigger:rotate-90" />
                <div className="flex items-center gap-1">
                  <span className="font-medium">{thinkingLabel}</span>
                  {isThinking && <ThinkingDots />}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="bg-muted rounded-lg p-3 text-sm prose prose-sm [&_p:not(.not-prose_p):not(:first-child)]:!mt-2">
                  {reasoningParts.map((part: any, idx: number) => (
                    <MemoizedMarkdown key={idx} content={part.reasoning} id={`${message.id}-reasoning-${idx}`} />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })()}
        <div className="prose">{renderedParts}</div>

                        {/* Web Search Sources */}
        {webSearchResults.length > 0 && (
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group/trigger">
              <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]/trigger:rotate-90" />
              <span className="font-medium">Sources ({webSearchResults.length})</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="flex flex-wrap gap-2">
                {webSearchResults.map((result, idx) => {
                  const domain = new URL(result.url).hostname.replace('www.', '');
                  const faviconUrl = `https://www.google.com/s2/favicons?sz=16&domain=${domain}`;

                  return (
                    <a
                      key={idx}
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-muted transition-colors text-sm group/source"
                    >
                      <img
                        src={faviconUrl}
                        alt=""
                        width={16}
                        height={16}
                        className="flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <span className="text-muted-foreground">{domain}</span>
                      <ExternalLink className="size-3 text-muted-foreground opacity-0 group-hover/source:opacity-100 transition-opacity flex-shrink-0" />
                    </a>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
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
                    <div className="flex items-center">
                      {getProviderIcon(provider)}
                      {provider.charAt(0).toUpperCase() + provider.slice(1)}
                    </div>
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
                try {
                  const newChatId = await branchChatAction(message.id);
                  toast.success("Chat branched successfully.");
                  router.push(`/chat/${newChatId}`);
                  // Invalidate all chat list pages
                  await mutate((key) => typeof key === "string" && key.startsWith("/api/chats?"));
                } catch (error) {
                  toast.error("Failed to branch chat.");
                }
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
                <span>{Math.round(meta.tokens / (meta.durationMs / 1000))} t/s</span>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

export const MemoizedChatMessage = memo(ChatMessage);
