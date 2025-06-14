"use client";

import { deleteChat, updateChatTitle } from "@/app/actions";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { IconButton } from "@/components/ui/icon-button";
import { Chat } from "@/generated/prisma";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { Check, Edit, Split, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

type ChatWithDate = Chat & {
    createdAt: string | Date;
    updatedAt: string | Date;
    parentChatId?: string | null;
};

interface HistoryCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HistoryCommandPalette({ open, onOpenChange }: HistoryCommandPaletteProps) {
  const [chats, setChats] = useState<ChatWithDate[]>([]);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      fetch("/api/chats")
        .then((res) => res.json())
        .then((data) => setChats(data));
    }
  }, [open]);

  const handleSelect = (chatId: string) => {
    router.push(`/chat/${chatId}`);
    onOpenChange(false);
  };

  const handleStartEdit = (chat: ChatWithDate) => {
    setEditingChatId(chat.id);
    setNewTitle(chat.title || "");
  };

  const handleConfirmEdit = (chatId: string) => {
    if (!newTitle.trim()) {
      setEditingChatId(null);
      return;
    }
    startTransition(async () => {
      try {
        await updateChatTitle(chatId, newTitle);
        setChats(
          chats.map((chat) =>
            chat.id === chatId ? { ...chat, title: newTitle } : chat
          )
        );
        setEditingChatId(null);
        toast.success("Title updated");
      } catch (error) {
        toast.error("Failed to update title");
      }
    });
  };

  const handleCancelEdit = (_chatId: string) => {
    setEditingChatId(null);
  };

  const handleDelete = (chatId: string) => {
    startTransition(async () => {
      try {
        await deleteChat(chatId);
        setChats(chats.filter((chat) => chat.id !== chatId));
        setDeletingChatId(null);
        toast.success("Chat deleted");
      } catch (error) {
        toast.error("Failed to delete chat");
      }
    });
  };

  const groupedChats = chats.reduce((acc, chat) => {
    const date = parseISO(chat.createdAt as string);
    let key = format(date, "MMMM d, yyyy");
    if (isToday(date)) {
      key = "Today";
    } else if (isYesterday(date)) {
      key = "Yesterday";
    }
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(chat);
    return acc;
  }, {} as Record<string, ChatWithDate[]>);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} className="max-w-xl">
      <CommandInput placeholder="Search chat history..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {Object.entries(groupedChats)
          .sort(([a], [b]) => {
             const order: Record<string, number> = { Today: 0, Yesterday: 1 };
             const aVal = order[a] ?? new Date(a).getTime();
             const bVal = order[b] ?? new Date(b).getTime();
             return aVal - bVal;          // lower value (newer) first
          })
          .map(([date, chats]) => (
            <CommandGroup key={date} heading={date} className="">
              {chats.map((chat) => (
                <CommandItem
                  key={chat.id}
                  value={chat.id}
                  onSelect={() => !editingChatId && !deletingChatId && handleSelect(chat.id)}
                  className="flex justify-between items-center !py-1 group"
                >
                  {editingChatId === chat.id ? (
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleConfirmEdit(chat.id);
                        } else if (e.key === "Escape") {
                          e.preventDefault();
                          handleCancelEdit(chat.id);
                        }
                      }}
                      className="bg-transparent border-none w-full"
                      autoFocus
                    />
                  ) : (
                    <span>{chat.title || "New Chat"}</span>
                  )}
                  <div className="flex items-center">
                    {editingChatId === chat.id ? (
                      <>
                        <IconButton
                          icon={<Check size={16} />}
                          tooltip="Save changes"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConfirmEdit(chat.id);
                          }}
                          className="p-1 h-auto w-auto"
                        />
                        <IconButton
                          icon={<X size={16} />}
                          tooltip="Cancel editing"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelEdit(chat.id);
                          }}
                          className="p-1 h-auto w-auto"
                        />
                      </>
                    ) : deletingChatId === chat.id ? (
                      <>
                        <IconButton
                          icon={<Check size={16} />}
                          tooltip="Confirm delete"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(chat.id);
                          }}
                          className="p-1 h-auto w-auto"
                        />
                        <IconButton
                          icon={<X size={16} />}
                          tooltip="Cancel delete"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingChatId(null);
                          }}
                          className="p-1 h-auto w-auto"
                        />
                      </>
                    ) : (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                        {chat.parentChatId && (
                          <IconButton
                            icon={<Split size={16} />}
                            tooltip="Go to parent chat"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/chat/${chat.parentChatId}`);
                              onOpenChange(false);
                            }}
                            className="p-1 h-auto w-auto"
                          />
                        )}
                        <IconButton
                          icon={<Edit size={16} />}
                          tooltip="Edit title"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(chat);
                          }}
                          className="p-1 h-auto w-auto"
                        />
                        <IconButton
                          icon={<Trash2 size={16} />}
                          tooltip="Delete chat"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingChatId(chat.id);
                          }}
                          className="p-1 h-auto w-auto"
                        />
                      </div>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
      </CommandList>
    </CommandDialog>
  );
}