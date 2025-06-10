"use client";

import { useAutoResume } from "@/hooks/use-auto-resume";
import { useChat } from "@ai-sdk/react";
import { UIMessage } from "ai";
import { ChatInput } from "./chat-input";
import ChatMessageContainer from "./chat-message-container";

function ChatClient({
  initialMessages,
  chatId
}: {
  initialMessages: UIMessage[];
  chatId: string;
}) {
  const {
    messages,
    handleSubmit,
    status,
    experimental_resume,
    data,
    setMessages,
    stop,
    input,
    setInput,
  } = useChat({
    initialMessages,
    id: chatId,
    experimental_prepareRequestBody: (body) => {
      const lastMessage = body.messages.at(-1);
      return {
        lastMessage,
        id: body.id
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
    <>
      {/* Chat Messages */}
      <ChatMessageContainer messages={messages} status={status} />

      {/* Input Footer */}
      <ChatInput
        onSubmit={handleSubmit}
        status={status}
        stop={stop}
        input={input}
        setInput={setInput}
      />
    </>
  );
}

export { ChatClient };
