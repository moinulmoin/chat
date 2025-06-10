"use client";

import { useAutoResume } from "@/hooks/use-auto-resume";
import { chatData } from "@/lib/utils";
import { useChat } from "@ai-sdk/react";
import { UIMessage } from "ai";
import { ChatHeader } from "./chat-header";
import { ChatInput } from "./chat-input";
import ChatMessageContainer from "./chat-message-container";

function ChatClient({ initialMessages }: { initialMessages: UIMessage[] }) {
  const { messages, handleSubmit, status, experimental_resume, data, setMessages } = useChat({
    initialMessages,
    experimental_prepareRequestBody: (options) => {
      const lastMessage = options.messages[options.messages.length - 1];
      return {
        lastMessage,
        chatId: options.id
      };
    }
  });

  useAutoResume({
    autoResume: true,
    initialMessages,
    experimental_resume,
    data,
    setMessages
  });
  return (
    <div className="flex flex-col h-screen bg-muted">
      {/* Header */}
      <ChatHeader user={chatData.user} />

      {/* Chat Messages */}
      <ChatMessageContainer messages={messages} status={status} />

      {/* Input Footer */}
      <ChatInput onSubmit={handleSubmit} status={status} />
    </div>
  );
}

export { ChatClient };
