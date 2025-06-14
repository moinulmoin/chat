"use client";

import {
  branchChatAction,
  deleteLastMessageAction,
  deleteTrailingMessagesAction,
  updateMessageAction
} from "@/actions";
import { MemoizedMarkdown } from "@/components/memoized-markdown";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Message as dbMessage } from "@/generated/prisma";
import { ModelKey, MODELS } from "@/lib/model-registry";
import { cn } from "@/lib/utils";
import { Message } from "ai";
import { Clipboard, Pencil, RefreshCcw, Split, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";

interface ChatMessageProps {
  message: Message;
  setMessages: Dispatch<SetStateAction<Message[]>>;
  isLastMessage: boolean;
  reload: () => void;
}

function WebSearchLoading() {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-primary/70 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <div className="w-2 h-2 bg-primary/70 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <div className="w-2 h-2 bg-primary/70 rounded-full animate-bounce" />
      </div>
      <span className="text-sm">Searching the web…</span>
    </div>
  );
}

export function ChatMessage({
  message,
  setMessages,
  isLastMessage,
  reload
}: ChatMessageProps) {
  const router = useRouter();

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
              <Button
                size="sm"
                onClick={() => {
                  if (!message.id) return;
                  startTransition(async () => {
                    await updateMessageAction(message.id, editedText!)
                    await deleteTrailingMessagesAction(message.id)
                  });

                  setMessages((prevMessages: Message[]) => {
                    const idx = prevMessages.findIndex((m) => m.id === message.id);
                    if (idx === -1) return prevMessages;
                    const updatedUserMsg: Message = {
                      ...prevMessages[idx],
                      parts: [{ type: "text", text: editedText } as any],
                    };
                    const trimmed = [...prevMessages.slice(0, idx + 1)];
                    trimmed[idx] = updatedUserMsg;
                    return trimmed;
                  });

                  setIsEditing(false);
                  reload();
                }}
              >
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
          <div className="flex items-center gap-x-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity absolute top-0 left-full">
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
              onClick={() => {
                if (!message.id) return;
                startTransition(async () => {
                  await deleteTrailingMessagesAction(message.id);
                });
                setMessages((prevMessages: Message[]) => {
                  const idx = prevMessages.findIndex((m) => m.id === message.id);
                  if (idx === -1) return prevMessages;
                  return prevMessages.slice(0, idx);
                });
              }}
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
    <div className="flex justify-start">
      <div className="flex flex-col gap-2 max-w-2xl group">
        <div className="prose">{renderedParts}</div>

        <div
          className={cn(
            "flex items-center gap-x-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity",
            isLastMessage && "opacity-100"
          )}
        >
          <IconButton
            variant="ghost"
            size="sm"
            icon={<RefreshCcw className="size-3.5" />}
            tooltip="Regenerate"
            className="hover:bg-background"
            onClick={() => {
              startTransition(async () => {
                await deleteLastMessageAction(message.id);
              });
              setMessages((prevMessages: Message[]) =>
                prevMessages.filter((m: Message) => m.id !== message.id)
              );
              reload();
            }}
          />
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
    </div>
  );
}
