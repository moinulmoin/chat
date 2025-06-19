"use client";

import { MemoizedMarkdown } from "@/components/memoized-markdown";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import { Message as dbMessage } from "@/generated/prisma";
import { ModelKey, MODELS } from "@/lib/model-registry";
import { Attachment, Message } from "ai";
import {
  ChevronRight,
  ExternalLink,
  FileText
} from "lucide-react";
import Image from "next/image";
import { memo, useEffect, useMemo, useState } from "react";

interface ChatMessageProps {
  message: Message;
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



function ChatMessage({
  message,
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

  // Extract text content once
  const userText = message?.parts?.map((part) => (part.type === "text" ? part.text : "")).join("");

  // Local state for editing user messages
  const [editedText, setEditedText] = useState(userText);

  // Keep editedText in sync when message changes (e.g., after save)
  useEffect(() => {
    setEditedText(userText);
  }, [userText]);



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
          {/* Available actions - only show when selected */}
          {isSelected && availableActions && (
            <div className="text-xs font-mono px-2 py-1 rounded-md self-end bg-yellow-200 text-yellow-800">
              Available: /{availableActions.join(', /')}
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

        </div>
      </div>
    );
  }



  return (
    <div className="flex justify-start flex-col group" data-role="assistant" data-message-index={messageIndex}>
      <div className={`flex flex-col gap-2 max-w-2xl ${
        isSelected ? 'ring-2 ring-yellow-400 ring-opacity-50 rounded-lg p-2 bg-yellow-50/50' : ''
      }`}>
        {/* Available actions - only show when selected */}
        {isSelected && availableActions && (
          <div className="text-xs font-mono px-2 py-1 rounded-md self-start bg-yellow-200 text-yellow-800">
            Available: /{availableActions.join(', /')}
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

      {/* Model name badge */}
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
        if (!modelName) return null;

        return (
          <div className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded-md mt-2 self-start">
            {modelName}
          </div>
        );
      })()}
    </div>
  );
}

export const MemoizedChatMessage = memo(ChatMessage);
