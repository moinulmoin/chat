import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { IconButton } from "@/components/ui/icon-button"
import { getSession } from "@/server/auth"
import { Share2, SquarePen, TextSearch } from "lucide-react"

interface ChatHeaderProps {
  title?: string
}

export async function ChatHeader({ title = "t0Chat"}: ChatHeaderProps) {
  const result = await getSession();
  console.log(result);
  // const updateChatTitle = useMutation(api.chat.updateChatTitle);
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
          <AvatarImage src={result?.user?.image!} alt={result?.user?.name!} />
          <AvatarFallback>{result?.user?.name?.charAt(0)}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}