"use client";

import { useAutoResume } from "@/hooks/use-auto-resume";
import { defaultModelKey } from "@/lib/chat-settings";
import { ModelKey } from "@/lib/model-registry";
import { useChat } from "@ai-sdk/react";
import { UIMessage } from "ai";
import { useState } from "react";
import { ChatInput } from "./chat-input";
import ChatMessageContainer from "./chat-message-container";

function ChatClient({
  initialMessages,
  chatId
}: {
  initialMessages: UIMessage[];
  chatId: string;
}) {
  const [selectedModelKey, setSelectedModelKey] = useState<ModelKey>(defaultModelKey);
  const [webSearch, setWebSearch] = useState(false);
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
    reload,
  } = useChat({
    initialMessages,
    id: chatId,
    experimental_prepareRequestBody: (body) => {
      const lastMessage = body.messages.at(-1);
      return {
        lastMessage,
        id: body.id,
        modelKey: selectedModelKey,
        webSearch
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
      <ChatMessageContainer
        messages={messages}
        status={status}
        setMessages={setMessages}
        reload={reload}
      />

      {/* Input Footer */}
      <ChatInput
        onSubmit={handleSubmit}
        status={status}
        stop={stop}
        input={input}
        setInput={setInput}
        modelKey={selectedModelKey}
        onModelChange={setSelectedModelKey}
        webSearch={webSearch}
        setWebSearch={setWebSearch}
      />
    </>
  );
}

export { ChatClient };
