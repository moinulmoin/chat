"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { IconButton } from "@/components/ui/icon-button"
import { Share2, SquarePen, TextSearch } from "lucide-react"

interface ChatHeaderProps {
  title?: string
  user: {
    name: string
    avatar: string
  }
}

export function ChatHeader({ title = "t0Chat", user }: ChatHeaderProps) {
  return (
    <header className="flex items-center justify-between p-4">
      <div className="flex items-center space-x-2">
        <span className="font-semibold">{title}</span>
      </div>
      <div className="flex items-center space-x-2">
        <IconButton
          variant="ghost"
          size="icon"
          icon={<SquarePen />}
          tooltip="New chat"
        />
        <IconButton
          variant="ghost"
          size="icon"
          icon={<Share2 />}
          tooltip="Share this chat"
        />
        <IconButton
          variant="ghost"
          size="icon"
          icon={<TextSearch className=" size-5" />}
          tooltip="History"
        />
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}