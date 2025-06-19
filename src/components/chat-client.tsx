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
import { TextSelectionMenu } from "./text-selection-menu";
import { HistoryCommandPalette } from "./history-command-palette";

const STARTER_QUESTIONS = [
  "Generate creative ideas for a project",
  "Explain the concept of AI",
  "Help me write a professional email"
];

const STARTER_COMMANDS = [
  { command: "/help", description: "Show all available commands" },
  { command: "/model", description: "Switch AI models" },
  { command: "/search", description: "Toggle web search" }
];

function EmptyState({ onQuestionClick }: { onQuestionClick: (question: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center space-y-6">
      <div>
        <h2 className="text-xl font-medium mb-2">Welcome to cmdchat</h2>
        <p className="text-sm text-muted-foreground">Commands inspired AI chat. Start typing or use slash commands.</p>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-2">Quick Start</h3>
          <div className="space-y-2">
            {STARTER_QUESTIONS.map((question, index) => (
              <button
                key={index}
                onClick={() => onQuestionClick(question)}
                className="block text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Try Commands</h3>
          <div className="space-y-1">
            {STARTER_COMMANDS.map((cmd, index) => (
              <button
                key={index}
                onClick={() => onQuestionClick(cmd.command)}
                className="block text-sm font-mono text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                <span className="text-primary">{cmd.command}</span> - {cmd.description}
              </button>
            ))}
          </div>
        </div>
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

  return (
    <>
      {/* Chat Messages */}
      <ChatMessageContainer status={status}>
        {messages.length === 0 ? (
          <EmptyState onQuestionClick={(question) => setInput(question)} />
        ) : (
          messages.map((message) => (
            <MemoizedChatMessage
              key={message.id}
              message={message}
              status={status}
              handleRegenerate={handleRegenerate}
              selectedModelKey={finalModelKey}
              handleUserMessageDelete={handleUserMessageDelete}
              handleUserMessageSave={handleUserMessageSave}
            />
          ))
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
