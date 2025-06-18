"use client";

import { deleteChat, updateChatTitle } from "@/app/actions";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  VirtualizedCommandList,
} from "@/components/ui/command";
import { IconButton } from "@/components/ui/icon-button";
import { Chat } from "@/generated/prisma";
import { useChats } from "@/hooks/use-chats";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { Check, Edit, Split, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { VListHandle } from "virtua";

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
  const [query, setQuery] = useState("");
  const { chats, mutate, setSize, hasMore, isLoading } = useChats(open, query);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const listRef = useRef<VListHandle>(null);

  const handleScroll = (offset: number) => {
    const list = listRef.current;
    if (!list || !hasMore || isLoading) {
      return;
    }

    const { scrollSize, viewportSize } = list;

    if (offset + viewportSize >= scrollSize - 20) {
      setSize((size) => size + 1);
    }
  };

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
      const dayDiff = differenceInCalendarDays(now, date);

      if (dayDiff === 0) {
        key = "Today";
      } else if (dayDiff === 1) {
        key = "Yesterday";
      } else {
        const monthsDiff = Math.floor(dayDiff / 30);
        key =
          monthsDiff >= 1
            ? `${monthsDiff} month${monthsDiff > 1 ? "s" : ""} ago`
            : `${dayDiff} day${dayDiff > 1 ? "s" : ""} ago`;
      }

      (grouped[key] ||= []).push(chat);
    });

    const sortedDates = Object.keys(grouped).sort((a, b) => {
      const now = new Date().getTime();
      const priority: Record<string, number> = { Today: now, Yesterday: now - 1 };
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
      <CommandInput
        placeholder="Search chat history..."
        value={query}
        onValueChange={setQuery}
      />
      <VirtualizedCommandList
        style={{ height: "400px" }}
        count={items.length}
        ref={listRef}
        onScroll={handleScroll}
        overscan={4}
      >
        <CommandEmpty>No results found.</CommandEmpty>
        {isLoading && !chats.length && (
          <div className="p-4 text-sm text-center">Loading...</div>
        )}
        {items.map((item) => {
          if (item.type === "header") {
            return (
              <div className="" key={item.label}>
                <CommandGroup heading={item.label} className="!py-1" />
              </div>
            );
          }

          const chat = item.chat;
          return (
            <div className="" key={chat.id}>
              <CommandItem
                onSelect={() => !editingChatId && !deletingChatId && handleSelect(chat.id)}
                value={chat.id}
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
        })}
      </VirtualizedCommandList>
    </CommandDialog>
  );
}
