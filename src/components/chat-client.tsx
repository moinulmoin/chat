"use client";

import { useAutoResume } from "@/hooks/use-auto-resume";
import { chatStore, setSelectedModel } from "@/lib/stores/chat";
import { useChat } from "@ai-sdk/react";
import { useStore } from "@nanostores/react";
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
  const { selectedModelKey, webSearch } = useStore(chatStore);
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
        onModelChange={setSelectedModel}
      />
    </>
  );
}

export { ChatClient };
