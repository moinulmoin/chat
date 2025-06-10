import { UIMessage } from "ai";
import { useEffect, useRef } from "react";
import { ChatMessage } from "./chat-message";

export default function ChatMessageContainer({
  messages,
  status
}: {
  messages: UIMessage[];
  status: 'submitted' | 'streaming' | 'ready' | 'error';
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: status === 'streaming' ? 'auto' : 'smooth' });
  }, [messages, status]);

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} status={status} />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </main>
  );
}
