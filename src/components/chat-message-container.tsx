import { Message } from "ai";
import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { ChatMessage } from "./chat-message";

interface ChatMessageContainerProps {
  messages: Message[];
  status: "submitted" | "streaming" | "ready" | "error";
  setMessages: Dispatch<SetStateAction<Message[]>>;
  reload: () => void;
}

export default function ChatMessageContainer({
  messages,
  status,
  setMessages,
  reload,
}: ChatMessageContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: status === "streaming" ? "auto" : "smooth"
    });
  }, [messages, status]);

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            status={status}
            setMessages={setMessages}
            isLastMessage={message.id === messages[messages.length - 1]?.id}
            reload={reload}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </main>
  );
}
