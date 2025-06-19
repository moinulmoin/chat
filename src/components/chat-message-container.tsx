import { useEffect, useRef } from "react";

interface ChatMessageContainerProps {
  status: "submitted" | "streaming" | "ready" | "error";
  children: React.ReactNode;
}

export default function ChatMessageContainer({ status, children }: ChatMessageContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: status === "streaming" ? "auto" : "smooth"
    });
  }, [status]);

  return (
    <div className="max-w-2xl mx-auto w-full p-4 space-y-4 grow overflow-y-auto">
      {children}
      {status === "submitted" && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-primary/70 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-primary/70 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-primary/70 rounded-full animate-bounce"></div>
          </div>
          <span className="text-sm sr-only">Processing...</span>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
