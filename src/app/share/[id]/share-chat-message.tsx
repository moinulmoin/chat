import { MemoizedMarkdown } from "@/components/memoized-markdown";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { UIMessage } from "ai";
import { ChevronRight, FileText } from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";

export function ShareChatMessage({ message }: { message: UIMessage }) {
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
      <div className="flex justify-end" data-role="user">
        <div className="flex flex-col gap-2 max-w-2xl group relative items-end">
          <div className="px-4 py-3 rounded-2xl max-w-fit bg-background border shadow-sm">
            <p className="text-sm whitespace-pre-wrap">{userText}</p>
          </div>

          {/* Attachments displayed separately like main chat */}
          {attachments.length > 0 && (
            <div className="flex flex-col gap-2">
              {attachments.map((attachment, idx) =>
                attachment.contentType?.startsWith("image/") ? (
                  <div key={idx}>
                    <Image
                      src={attachment.url}
                      alt={attachment.name || "attached image"}
                      className="object-cover rounded-xl"
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
                    <span className="text-sm truncate font-mono">{attachment.name}</span>
                  </div>
                )
              )}
            </div>
          )}


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

  // Extract web search results for sources display (like main chat)
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

  return (
    <div className="flex justify-start flex-col group" data-role="assistant">
      <div className="flex flex-col gap-3 max-w-2xl">
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
                <div className="bg-muted rounded-lg p-4 text-sm prose prose-sm [&_p:not(.not-prose_p):not(:first-child)]:!mt-2">
                  {reasoningParts.map((part: any, idx: number) => (
                    <MemoizedMarkdown key={idx} content={part.reasoning} id={`${message.id}-reasoning-${idx}`} />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })()}

        {/* Main message content */}
        <div className="prose prose-sm max-w-none [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-lg [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded">
          {renderedParts}
        </div>

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
                      <Image
                        src="/globe.svg"
                        alt="External"
                        width={12}
                        height={12}
                        className="opacity-0 group-hover/source:opacity-100 transition-opacity flex-shrink-0"
                      />
                    </a>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>


    </div>
  );
}