"use client";

import { Share2, TextSearch } from "lucide-react";
import { useState } from "react";
import { HistoryCommandPalette } from "./history-command-palette";
import { NewChatButton } from "./new-chat-btn";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { IconButton } from "./ui/icon-button";

export function NavbarClient({ user }: { user: { name?: string | null; email?: string | null; image?: string | null } | null }) {
    const [historyOpen, setHistoryOpen] = useState(false);
    return (
        <div className="flex items-center gap-2">
            <NewChatButton />
            <IconButton variant="ghost" size="icon" icon={<Share2 />} tooltip="Share this chat" />
            <IconButton
                variant="ghost"
                size="icon"
                icon={<TextSearch className=" size-5" />}
                tooltip="History"
                onClick={() => setHistoryOpen(true)}
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
                    <DropdownMenuItem>
                        Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                        Log out
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}