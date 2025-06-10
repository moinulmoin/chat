"use client";

import { SquarePen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { IconButton } from './ui/icon-button';

export function NewChatButton() {
  const router = useRouter();
  return (
    <IconButton variant="ghost" size="icon" icon={<SquarePen />} tooltip="New chat" onClick={() => {
      router.push("/chat");
    }} />
  )
}
