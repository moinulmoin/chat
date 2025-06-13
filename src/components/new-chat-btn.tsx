"use client";

import { SquarePen } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { IconButton } from './ui/icon-button';

export function NewChatButton() {
  const router = useRouter();
  const params = useParams();
  const [shouldShow, setShouldShow] = useState(false);
  const chatId = params?.id as string;

  useEffect(() => {
    if (chatId) {
      fetch(`/api/chats/${chatId}/messages/count`)
        .then((res) => res.json())
        .then((data) => {
          setShouldShow(data.count >= 2);
        })
        .catch(() => {
          setShouldShow(false);
        });
    } else {
      setShouldShow(false);
    }
  }, [chatId]);

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
