"use client";

import { useMessageCount } from '@/hooks/use-message-count';
import { SquarePen } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { IconButton } from './ui/icon-button';

export function NewChatButton() {
  const router = useRouter();
  const params = useParams();
  const chatId = params?.id as string;
  const { count } = useMessageCount(chatId);

  const shouldShow = count !== undefined && count >= 2;

  if (!shouldShow) {
    return null;
  }

  return (
    <IconButton
      variant="ghost"
      size="icon"
      icon={<SquarePen />}
      tooltip="New chat"
      onClick={() => {
        router.push("/chat");
      }}
    />
  );
}
