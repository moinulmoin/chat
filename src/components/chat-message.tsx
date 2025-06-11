"use client";

import { branchChatAction, deleteLastMessageAction } from "@/actions";
import { MemoizedMarkdown } from "@/components/memoized-markdown";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";
import { ChatStatus } from "@/types";
import { Message } from "ai";
import { Clipboard, RefreshCcw, Split } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";

interface ChatMessageProps {
  message: Message;
  status: ChatStatus;
  setMessages: Dispatch<SetStateAction<Message[]>>;
  isLastMessage: boolean;
  reload: () => void;
}

export function ChatMessage({
  status,
  message,
  setMessages,
  isLastMessage,
  reload
}: ChatMessageProps) {
  const router = useRouter();

  if (message.role === "user") {
    const text = message?.parts?.map((part) => (part.type === "text" ? part.text : "")).join("");
    return (
      <div className="flex justify-end">
        <div className="px-4 py-2 rounded-2xl max-w-fit bg-background border">
          <p className="text-sm">{text}</p>
        </div>
      </div>
    );
  }

  const isSubmitted = status !== "streaming" && status !== "ready";

  let content = "";
  message?.parts?.forEach((part) => {
    if (part.type === "text") {
      content += part.text;
    }
  });

  if (isLastMessage && isSubmitted) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-background rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-background rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-background rounded-full animate-bounce"></div>
        </div>
        <span className="text-sm">Processing...</span>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="flex flex-col gap-2 max-w-2xl group">
        <div className="prose prose-neutral">
          <MemoizedMarkdown content={content} id={message.id} />
        </div>

        {status === "ready" && (
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
                  navigator.clipboard.writeText(content).catch(() => {});
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
        )}
      </div>
    </div>
  );
}
