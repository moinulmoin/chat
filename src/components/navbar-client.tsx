"use client";

import { shareChatAction } from "@/actions";
import { useMessageCount } from "@/hooks/use-message-count";
import { signOut } from "@/lib/auth-client";
import { Loader2, Share2, TextSearch } from "lucide-react";
import { useParams } from "next/navigation";
import { startTransition, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";
import { HistoryCommandPalette } from "./history-command-palette";
import { NewChatButton } from "./new-chat-btn";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { IconButton } from "./ui/icon-button";

export function NavbarClient({ user }: { user: { name?: string | null; email?: string | null; image?: string | null } | null }) {
    const [historyOpen, setHistoryOpen] = useState(false);
    const [isShareLoading, setIsShareLoading] = useState(false);
    const params = useParams();
    const chatId = params?.id as string | undefined;
    const { count } = useMessageCount(chatId);

    const shouldShowShareButton = count !== undefined && count >= 2;

    const handleShare = () => {
        if (!chatId) {
            toast.error("Open a chat first");
            return;
        }

        setIsShareLoading(true);
        startTransition(async () => {
            try {
                const slug = await shareChatAction(chatId);
                const url = `${window.location.origin}/share/${slug}`;
                await navigator.clipboard.writeText(url);
                toast.success("Share link copied to clipboard");
            } catch (error) {
                toast.error("Failed to copy link");
            } finally {
                setIsShareLoading(false);
            }
        });
    };

    const handleOpenHistory = () => {
        setHistoryOpen(true);
    };

    // Keyboard shortcuts
    useHotkeys('ctrl+s, meta+s', handleShare, {
        preventDefault: true,
        enabled: shouldShowShareButton && !isShareLoading,
        description: 'Share current chat'
    });

    useHotkeys('ctrl+k, meta+k', handleOpenHistory, {
        preventDefault: true,
        description: 'Open chat history'
    });

    return (
        <div className="flex items-center gap-2">
            <NewChatButton />
            {shouldShowShareButton &&
                <IconButton
                    variant="ghost"
                    size="icon"
                    icon={isShareLoading ? <Loader2 className="size-4 animate-[spin_0.3s_linear_infinite]" /> : <Share2 />}
                    tooltip={`Share this chat (Ctrl+S)`}
                    onClick={handleShare}
                    disabled={isShareLoading}
                />
            }
            <IconButton
                variant="ghost"
                size="icon"
                icon={<TextSearch className=" size-5" />}
                tooltip={`History (Ctrl+K)`}
                onClick={handleOpenHistory}
            />
            <HistoryCommandPalette open={historyOpen} onOpenChange={setHistoryOpen} />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user?.image!} alt={user?.name!} />
                            <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{user?.name}</p>
                            <p className="text-xs leading-none text-muted-foreground">
                                {user?.email}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} >
                        Log out
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}