"use client";

import { useMessageCount } from "@/hooks/use-message-count";
import { Loader2, SquarePen } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { IconButton } from "./ui/icon-button";

export function NewChatButton() {
  const router = useRouter();
  const params = useParams();
  const chatId = params?.id as string;
  const { count } = useMessageCount(chatId);
  const [isLoading, setIsLoading] = useState(false);

  const shouldShow = count !== undefined && count >= 2;

  const handleNewChat = async () => {
    setIsLoading(true);

    router.push("/chat");
  };

  // Keyboard shortcut for new chat
  useHotkeys('ctrl+n, meta+n', handleNewChat, {
    preventDefault: true,
    enabled: shouldShow && !isLoading,
    description: 'Open new chat'
  });

  if (!shouldShow) {
    return null;
  }

  return (
    <IconButton
      variant="ghost"
      size="icon"
      icon={
        isLoading ? (
          <Loader2 className="size-4 animate-[spin_0.3s_linear_infinite]" />
        ) : (
          <SquarePen />
        )
      }
      tooltip={`New chat (Ctrl+N)`}
      onClick={handleNewChat}
      disabled={isLoading}
    />
  );
}
