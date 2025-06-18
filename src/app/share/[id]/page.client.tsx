import { MemoizedMarkdown } from "@/components/memoized-markdown";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import { IconButton } from "@/components/ui/icon-button";
import { UIMessage } from "ai";
import {
  ChevronRight,
  Clipboard
} from "lucide-react";
import Image from "next/image";
import { memo, useMemo } from "react";
import { toast } from "sonner";

function ShareChatMessage({ message }: { message: UIMessage }) {
  // Extract text content for user messages
  const userText = message?.parts?.map((part) => (part.type === "text" ? part.text : "")).join("");

  // Extract attachments
  const attachments = message.experimental_attachments || [];

  /* Render every part (text + tool invocation) in correct order */
  const renderedParts = useMemo(() => {
    return message.parts?.map((part, idx) => {
      if (part.type === "text") {
        return <MemoizedMarkdown key={idx} content={part.text} id={`${message.id}-${idx}`} />;
      }
      if (part.type === "tool-invocation") {
        const { toolName, state } = part.toolInvocation;
        if (toolName === "webSearch") {
          // For share page, just hide web search tool invocations
          return null;
        }
      }
      return null;
    });
  }, [message.parts, message.id]);

  if (message.role === "user") {
    return (
      <div className="flex justify-end flex-col group" data-role="user">
        <div className="flex flex-col gap-2 max-w-2xl">
          <div className="relative flex justify-end">
            <div className="px-4 py-2 border rounded-2xl bg-background break-words">
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {attachments.map((attachment) => (
                    <div key={attachment.name} className="flex items-center gap-2 text-sm">
                      {attachment.contentType?.startsWith("image/") ? (
                        <Image
                          src={attachment.url}
                          alt={attachment.name!}
                          width={200}
                          height={200}
                          className="rounded border max-h-48 object-contain"
                        />
                      ) : (
                        <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs">
                          <span>{attachment.name}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap">{userText}</p>
            </div>
            {/* Copy button for user messages */}
            <div className="flex flex-row-reverse items-center gap-x-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity absolute top-0 mt-1 mr-1 right-full">
              <IconButton
                variant="ghost"
                size="sm"
                icon={<Clipboard className="size-3.5" />}
                tooltip="Copy"
                onClick={() => {
                  if (typeof navigator !== "undefined" && navigator.clipboard) {
                    navigator.clipboard.writeText(userText ?? "").catch(() => {});
                    toast.success("Copied to clipboard");
                  }
                }}
                className="hover:bg-background"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Assistant message
  const copyableText = useMemo(() => {
    return (
      message?.parts
        ?.filter((p) => p.type === "text")
        .map((p: any) => p.text)
        .join("") || ""
    );
  }, [message.parts]);

  return (
    <div className="flex justify-start flex-col group" data-role="assistant">
      <div className="flex flex-col gap-2 max-w-2xl">
        {/* Show reasoning/thinking section for assistant messages */}
        {(() => {
          const reasoningParts = message.parts?.filter((part: any) => part.type === "reasoning");
          if (!reasoningParts || reasoningParts.length === 0) return null;

          return (
            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group/trigger">
                <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]/trigger:rotate-90" />
                <div className="flex items-center gap-1">
                  <span className="font-medium">Thoughts</span>
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
      </div>

      {/* Only show copy button for assistant messages */}
      <div className="flex items-center gap-x-1 w-full grow justify-between text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
        <div>
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
        </div>
      </div>
    </div>
  );
}

const MemoizedShareChatMessage = memo(ShareChatMessage);

export function ShareChatClient({
  initialMessages,
  title,
  author
}: {
  initialMessages: UIMessage[];
  title: string;
  author: string;
}) {
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">
          Shared by: <span className="font-medium">{author}</span>
        </p>
      </div>

      {/* Messages */}
      <div className="max-w-2xl mx-auto w-full px-4 space-y-4 grow overflow-y-auto">
        {initialMessages.map((message) => (
          <MemoizedShareChatMessage key={message.id} message={message} />
        ))}
      </div>
    </div>
  );
}