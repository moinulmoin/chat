"use client";

import { deleteTrailingMessagesAction, updateMessageAction } from "@/actions";
import { useAutoResume } from "@/hooks/use-auto-resume";
import { ModelKey } from "@/lib/model-registry";
import { chatStore, setSelectedModel } from "@/lib/stores/chat";
import { useChat } from "@ai-sdk/react";
import { useStore } from "@nanostores/react";
import { Message, UIMessage } from "ai";
import { startTransition, useCallback } from "react";
import { ChatInput } from "./chat-input";
import { MemoizedChatMessage } from "./chat-message";
import ChatMessageContainer from "./chat-message-container";

function ChatClient({ initialMessages, chatId }: { initialMessages: UIMessage[]; chatId: string }) {
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
    reload
  } = useChat({
    initialMessages,
    id: chatId,
    sendExtraMessageFields: true,
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

  const handleRegenerate = useCallback(
    ({ messageId, modelKey }: { messageId: string; modelKey?: ModelKey }) => {
      if (modelKey) {
        setSelectedModel(modelKey);
      }

      startTransition(async () => {
        await deleteTrailingMessagesAction(messageId);
      });

      setMessages((prevMessages: Message[]) =>
        prevMessages.filter((m: Message) => m.id !== messageId)
      );

      reload({
        body: {
          modelKey: modelKey,
        }
      });
    },
    []
  );

  const handleUserMessageSave = useCallback(
    ({ messageId, editedText }: { messageId: string; editedText: string }) => {
      if (!messageId) return;
      startTransition(async () => {
        await updateMessageAction(messageId, editedText!);
        await deleteTrailingMessagesAction(messageId);
      });

      setMessages((prevMessages: Message[]) => {
        const idx = prevMessages.findIndex((m) => m.id === messageId);
        if (idx === -1) return prevMessages;
        const updatedUserMsg: Message = {
          ...prevMessages[idx],
          parts: [{ type: "text", text: editedText } as any]
        };
        const trimmed = [...prevMessages.slice(0, idx + 1)];
        trimmed[idx] = updatedUserMsg;
        return trimmed;
      });

      reload();
    },
    []
  );

  const handleUserMessageDelete = useCallback(
    ({ messageId }: { messageId: string }) => {
      if (!messageId) return;
      startTransition(async () => {
        await deleteTrailingMessagesAction(messageId);
      });
      setMessages((prevMessages: Message[]) => {
        const idx = prevMessages.findIndex((m) => m.id === messageId);
        if (idx === -1) return prevMessages;
        return prevMessages.slice(0, idx);
      });
    },
    []
  );

  return (
    <>
      {/* Chat Messages */}
      <ChatMessageContainer status={status}>
        {messages.map((message, i) => (
          <MemoizedChatMessage
            key={message.id}
            message={message}
            status={status}
            handleRegenerate={handleRegenerate}
            selectedModelKey={selectedModelKey}
            handleUserMessageDelete={handleUserMessageDelete}
            handleUserMessageSave={handleUserMessageSave}
          />
        ))}
      </ChatMessageContainer>

      {/* Input Footer */}
      <ChatInput
        modelKey={selectedModelKey}
        onSubmit={handleSubmit}
        status={status}
        stop={stop}
        input={input}
        setInput={setInput}
        webSearch={webSearch}
      />
    </>
  );
}

export { ChatClient };
