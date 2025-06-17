"use client";

import { deleteChat, updateChatTitle } from "@/app/actions";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { IconButton } from "@/components/ui/icon-button";
import { Chat } from "@/generated/prisma";
import { useChats } from "@/hooks/use-chats";
import { isToday, isYesterday, parseISO } from "date-fns";
import { Check, Edit, Split, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { VList } from "virtua";

type ChatWithDate = Chat & {
  createdAt: string | Date;
  updatedAt: string | Date;
  parentChatId?: string | null;
};

type ListItem = { type: "header"; label: string } | { type: "chat"; chat: ChatWithDate };

interface HistoryCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HistoryCommandPalette({ open, onOpenChange }: HistoryCommandPaletteProps) {
  const { chats, mutate, setSize, hasMore, isLoading } = useChats(open);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasMore && !isLoading) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setSize((size) => size + 1);
          }
        },
        { root: listRef.current, threshold: 1.0 }
      );

      const lastItem = listRef.current?.querySelector(".virtua-item:last-child");
      if (lastItem) {
        observer.observe(lastItem);
      }

      return () => observer.disconnect();
    }
  }, [chats.length, hasMore, isLoading, setSize]);

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
        mutate();
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
        mutate();
        setDeletingChatId(null);
        toast.success("Chat deleted");
      } catch (error) {
        toast.error("Failed to delete chat");
      }
    });
  };

  const items = useMemo(() => {
    const grouped: Record<string, ChatWithDate[]> = {};
    const now = new Date();

    chats.forEach((chat) => {
      const date = parseISO(chat.createdAt as string);
      let key: string;

      if (isToday(date)) {
        key = "Today";
      } else if (isYesterday(date)) {
        key = "Yesterday";
      } else {
        const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        const monthsDiff = Math.floor(daysDiff / 30);
        key = monthsDiff >= 1 ? `${monthsDiff} month${monthsDiff > 1 ? "s" : ""} ago` : `${daysDiff} day${daysDiff > 1 ? "s" : ""} ago`;
      }

      (grouped[key] ||= []).push(chat);
    });

    const sortedDates = Object.keys(grouped).sort((a, b) => {
      const priority: Record<string, number> = { Today: -2, Yesterday: -1 }; // negative for higher priority
      const aVal = priority[a] ?? new Date(grouped[a][0].createdAt as string).getTime();
      const bVal = priority[b] ?? new Date(grouped[b][0].createdAt as string).getTime();
      return bVal - aVal; // newest group first
    });

    const listItems: ListItem[] = [];
    sortedDates.forEach((date) => {
      listItems.push({ type: "header", label: date });
      grouped[date].forEach((chat) => {
        listItems.push({ type: "chat", chat });
      });
    });
    return listItems;
  }, [chats]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} className="max-w-xl">
      <CommandInput placeholder="Search chat history..." />
      <CommandList style={{ height: "400px", overflowY: "auto" }} ref={listRef}>
        <CommandEmpty>No results found.</CommandEmpty>
        {isLoading && !chats.length && <div className="p-4 text-sm text-center">Loading...</div>}
        <VList style={{ height: 400 }} overscan={4}>
          {items.map((_, index) => null /* placeholder to satisfy count */)}
        </VList>
        <VList style={{ height: 400 }} overscan={4}>
          {(index: number) => {
            const item = items[index];

            if (item.type === "header") {
              return (
                <div className="px-2 virtua-item">
                  <CommandGroup heading={item.label} className="!py-1" />
                </div>
              );
            }

            const chat = item.chat;
            return (
              <div className="virtua-item">
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
                      <>
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
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
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
                      </>
                    )}
                  </div>
                </CommandItem>
              </div>
            );
          }}
        </VList>
      </CommandList>
    </CommandDialog>
  );
}
