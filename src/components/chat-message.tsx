"use client";

import { MemoizedMarkdown } from "@/components/memoized-markdown";
import { IconButton } from "@/components/ui/icon-button";
import { ChatStatus } from "@/types";
import { UIMessage } from "ai";
import { Clipboard, RotateCw, Split } from "lucide-react";

interface ChatMessageProps {
  message: UIMessage;
  status: ChatStatus;
}

export function ChatMessage({ status, message }: ChatMessageProps) {

  if (message.role === "user") {
    const text = message.parts.map((part) => (part.type === "text" ? part.text : "")).join("");
    return (
      <div className="flex justify-end">
        <div className="px-4 py-2 rounded-2xl max-w-fit bg-background border">
          <p className="text-sm">{text}</p>
        </div>
      </div>
    );
  }

  let content = "";
  message.parts.forEach((part) => {
    if (part.type === "text") {
      content += part.text;
    }
  });

  return (
    <div className="flex justify-start">
      <div className="flex flex-col gap-2 max-w-2xl group">
        <div className="prose prose-neutral">
          <MemoizedMarkdown content={content} id={message.id} />
        </div>
        {status === "ready" && (
          <div className="flex items-center gap-x-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            <IconButton
              variant="ghost"
              size="sm"
              icon={<RotateCw className="size-3.5" />}
              tooltip="Regenerate"
              className="hover:bg-background"
            />
            <IconButton
              variant="ghost"
              size="sm"
              icon={<Clipboard className="size-3.5" />}
              tooltip="Copy"
            />
            <IconButton
              variant="ghost"
              size="sm"
              icon={<Split className="size-3.5" />}
              tooltip="Branching"
            />
            {/* <div className="text-xs text-muted-foreground">{JSON.stringify(message.metadata)}</div> */}
          </div>
        )}
      </div>
    </div>
  );
}
