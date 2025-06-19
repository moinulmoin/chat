"use client";

import { useMessageCount } from "@/hooks/use-message-count";
import { SquarePen } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { IconButton } from "./ui/icon-button";

export function NewChatButton() {
  const router = useRouter();
  const params = useParams();
  const chatId = params?.id as string;
  const { count } = useMessageCount(chatId);

  const shouldShow = count !== undefined && count >= 2;

  const handleNewChat = () => {
    // Directly navigate to the new chat page without showing a loading spinner
    router.push("/chat");
  };

  // Keyboard shortcut for new chat
  useHotkeys('ctrl+c, meta+c', handleNewChat, {
    preventDefault: true,
    enabled: shouldShow,
    description: 'Open new chat'
  });

  if (!shouldShow) {
    return null;
  }

  return (
    <IconButton
      variant="ghost"
      size="icon"
      icon={<SquarePen />}
      tooltip={`New chat (Ctrl+C)`}
      onClick={handleNewChat}
    />
  );
}
