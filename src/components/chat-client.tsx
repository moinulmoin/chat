"use client";

import { metadataSchema } from "@/app/api/chat/metadata-schema";
import { chatData } from "@/lib/utils";
import { zodSchema } from "@ai-sdk/provider-utils";
import { UIMessage, useChat } from "@ai-sdk/react";
import { useEffect, useRef } from "react";
import { ChatHeader } from "./chat-header";
import { ChatInput } from "./chat-input";
import { ChatMessage } from "./chat-message";

function ChatClient({ initialMessages }: { initialMessages: UIMessage[] }) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    messageMetadataSchema: zodSchema(metadataSchema),
    messages: initialMessages
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-muted">
      {/* Header */}
      <ChatHeader user={chatData.user} />

      {/* Chat Messages */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} status={status} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Footer */}
      <ChatInput onSubmit={(text) => sendMessage({ text })} status={status} />
    </div>
  );
}

export { ChatClient };
