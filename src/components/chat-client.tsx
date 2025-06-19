"use client";

import {
  deleteTrailingMessagesAction,
  updateMessageAction
} from "@/actions";
import { useAutoResume } from "@/hooks/use-auto-resume";
import { swrKeys } from "@/lib/keys";
import { ModelKey } from "@/lib/model-registry";
import { currentModelKeyAtom, setModelKey, webSearchAtom } from "@/lib/stores/chat";
import { UploadedAttachment } from "@/lib/types";
import { useChat } from "@ai-sdk/react";
import { useStore } from "@nanostores/react";
import { upload } from "@vercel/blob/client";
import { Message, UIMessage } from "ai";
import { nanoid } from "nanoid";
import { startTransition, useCallback, useState } from "react";
import { mutate } from "swr";
import { ChatInput } from "./chat-input";
import { MemoizedChatMessage } from "./chat-message";
import ChatMessageContainer from "./chat-message-container";
import { HistoryCommandPalette } from "./history-command-palette";
import { TextSelectionMenu } from "./text-selection-menu";

function EmptyState({ onQuestionClick }: { onQuestionClick: (question: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center space-y-4">
      <div className="space-y-2">
        <h2 className="text-lg font-medium">Welcome to /chat</h2>
        <p className="text-sm text-muted-foreground">
          Where conversations begin with /
        </p>
      </div>

      <div className="space-y-1 text-sm font-mono text-muted-foreground/80">
        <div>Type <span className="text-primary">/</span> for commands</div>
        <div>Press <span className="text-primary">↑↓</span> to navigate</div>
        <div>Hit <span className="text-primary">Enter</span> to execute</div>
      </div>
    </div>
  );
}

function ChatClient({
  initialMessages,
  chatId
}: {
  initialMessages: UIMessage[];
  chatId: string;
}) {
  const modelKeyFromStore = useStore(currentModelKeyAtom);
  const webSearch = useStore(webSearchAtom);
  const [uploadedAttachment, setUploadedAttachment] = useState<UploadedAttachment | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Unified message selection state
  const [selectionMode, setSelectionMode] = useState<'select' | null>(null);
  const [selectedMessageIndex, setSelectedMessageIndex] = useState<number>(-1); // Index in messages array
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [regenerateMode, setRegenerateMode] = useState<string | null>(null); // messageId to regenerate

  const finalModelKey = modelKeyFromStore;
  const {
    messages,
    handleSubmit: originalHandleSubmit,
    status,
    experimental_resume,
    data,
    setMessages,
    stop,
    input,
    setInput,
    reload,
    append
  } = useChat({
    initialMessages,
    id: chatId,
    sendExtraMessageFields: true,
    experimental_prepareRequestBody: (body) => {
      const lastMessage = body.messages.at(-1);
      return {
        lastMessage,
        id: body.id,
        webSearch,
        modelKey: finalModelKey
      };
    },
    onFinish: () => {
      if (chatId && messages.length === 2) {
        mutate(swrKeys.messageCount(chatId));
      }
    }
  });

  useAutoResume({
    autoResume: true,
    initialMessages,
    experimental_resume,
    data,
    setMessages
  });

  const handleSubmit = useCallback(
    (
      e:
        | React.FormEvent<HTMLFormElement>
        | React.KeyboardEvent<HTMLTextAreaElement>
        | React.MouseEvent<HTMLButtonElement>
    ) => {
      const attachments =
        uploadedAttachment && uploadedAttachment.status === "completed"
          ? [
              {
                name: uploadedAttachment.name,
                url: uploadedAttachment.url!,
                contentType: uploadedAttachment.contentType!
              }
            ]
          : [];

      originalHandleSubmit(e, {
        experimental_attachments: attachments
      });

      // Clear attachment after sending
      if (uploadedAttachment && uploadedAttachment.status === "completed") {
        setUploadedAttachment(null);
      }
    },
    [originalHandleSubmit, uploadedAttachment]
  );

  const handleFileUpload = async (file: File) => {
    const newAttachment: UploadedAttachment = {
      id: nanoid(),
      name: file.name,
      status: "uploading"
    };
    setUploadedAttachment(newAttachment);

    try {
      const newBlob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload"
      });

      setUploadedAttachment((prev) =>
        prev
          ? {
              ...prev,
              status: "completed",
              url: newBlob.url,
              contentType: file.type
            }
          : null
      );
    } catch (error) {
      setUploadedAttachment((prev) =>
        prev
          ? {
              ...prev,
              status: "error"
            }
          : null
      );
    }
  };

  const handleRemoveAttachment = async () => {
    if (uploadedAttachment?.url && uploadedAttachment.status === "completed") {
      try {
        await fetch(`/api/upload?url=${encodeURIComponent(uploadedAttachment.url)}`, {
          method: "DELETE"
        });
      } catch (error) {
        console.error("Failed to delete blob:", error);
      }
    }
    setUploadedAttachment(null);
  };

  const handleRegenerate = useCallback(
    ({ messageId, modelKey }: { messageId: string; modelKey?: ModelKey }) => {
      if (modelKey) {
        setModelKey(modelKey);
      }

      startTransition(async () => {
        await deleteTrailingMessagesAction(messageId);
      });

      setMessages((prevMessages: Message[]) =>
        prevMessages.filter((m: Message) => m.id !== messageId)
      );

      reload();
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

  const handleUserMessageDelete = useCallback(({ messageId }: { messageId: string }) => {
    if (!messageId) return;
    startTransition(async () => {
      await deleteTrailingMessagesAction(messageId);
    });
    setMessages((prevMessages: Message[]) => {
      const idx = prevMessages.findIndex((m) => m.id === messageId);
      if (idx === -1) return prevMessages;
      return prevMessages.slice(0, idx);
    });
  }, []);

  const handleAddToChat = useCallback((selectedText: string) => {
    setInput((prevInput) => {
      const trimmedInput = prevInput.trim();
      if (trimmedInput) {
        return `${trimmedInput}\n\n${selectedText}`;
      }
      return selectedText;
    });
  }, []);

  const handleExplain = useCallback((selectedText: string) => {
    append({
      role: "user",
      content: `Explain this: ${selectedText}`
    });
  }, []);

  const exitEditingMode = useCallback(() => {
    setIsInlineEditing(false);
    setEditingMessageId(null);
  }, []);

  return (
    <>
      {/* Chat Messages */}
      <ChatMessageContainer status={status}>
        {messages.length === 0 ? (
          <EmptyState onQuestionClick={(question) => setInput(question)} />
        ) : (
                    messages.map((message, index) => {
            // Check if this message is selected (using array index)
            const isSelected = selectionMode === 'select' && selectedMessageIndex === index;

            // Get available actions for this message type
            const availableActions = message.role === 'user'
              ? ['edit', 'copy', 'delete']
              : ['copy', 'regenerate', 'branch'];

            return (
              <MemoizedChatMessage
                key={message.id}
                message={message}
                messageIndex={index}
                isSelected={isSelected}
                selectionMode={selectionMode}
                availableActions={availableActions}
                isEditing={editingMessageId === message.id}
                status={status}
                handleRegenerate={handleRegenerate}
                selectedModelKey={finalModelKey}
                handleUserMessageDelete={handleUserMessageDelete}
                handleUserMessageSave={handleUserMessageSave}
                exitEditingMode={exitEditingMode}
              />
            );
          })
        )}
      </ChatMessageContainer>

      {/* Input Footer */}
      <ChatInput
        modelKey={finalModelKey}
        onSubmit={handleSubmit}
        status={status}
        stop={stop}
        input={input}
        setInput={setInput}
        webSearch={webSearch}
        onFileUpload={handleFileUpload}
        uploadedAttachment={uploadedAttachment}
        onRemoveAttachment={handleRemoveAttachment}
        chatId={chatId}
        setHistoryOpen={setHistoryOpen}
        selectionMode={selectionMode}
        selectedMessageIndex={selectedMessageIndex}
        setSelectionMode={setSelectionMode}
        setSelectedMessageIndex={setSelectedMessageIndex}
        messages={messages}
        handleUserMessageDelete={handleUserMessageDelete}
        handleUserMessageSave={handleUserMessageSave}
        handleRegenerate={handleRegenerate}
        setIsInlineEditing={setIsInlineEditing}
        setEditingMessageId={setEditingMessageId}
        exitEditingMode={exitEditingMode}
        regenerateMode={regenerateMode}
        setRegenerateMode={setRegenerateMode}
      />

      {/* Text Selection Context Menu */}
      <TextSelectionMenu onAddToChat={handleAddToChat} onExplain={handleExplain} />

      {/* History Command Palette */}
      <HistoryCommandPalette
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />
    </>
  );
}

export { ChatClient };
