"use client";

import { deleteChat, updateChatTitle } from "@/actions";
import {
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { IconButton } from "@/components/ui/icon-button";
import { Chat } from "@/generated/prisma";
import { useChats } from "@/hooks/use-chats";
import { differenceInCalendarDays, differenceInHours, differenceInMinutes, format, parseISO } from "date-fns";
import { Check, Edit, Split, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

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

const getRelativeTime = (date: Date) => {
  const now = new Date();
  const minutes = differenceInMinutes(now, date);
  const hours = differenceInHours(now, date);
  const days = differenceInCalendarDays(now, date);

  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;

  return format(date, "MMM d");
};

export function HistoryCommandPalette({ open, onOpenChange }: HistoryCommandPaletteProps) {
  const [query, setQuery] = useState("");
  const { chats, mutate, isLoading } = useChats(open, query);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSelect = (chatId: string) => {
    onOpenChange(false);
    startTransition(async () => {
      router.push(`/chat/${chatId}`);
    });
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
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      className="max-w-2xl rounded-2xl border-0 bg-white/95 backdrop-blur-sm shadow-2xl"
    >
      <div className="border-b border-border/10">
        <CommandInput
          placeholder="Search chat history..."
          value={query}
          onValueChange={setQuery}
          className="px-4 py-3 border-0 bg-transparent focus:ring-0 focus:outline-none placeholder:text-muted-foreground/60 text-base"
        />
      </div>
      <CommandList
        style={{ height: "400px" }}
        className="p-1"
      >
        {isLoading && !chats.length && (
          <CommandItem disabled className="p-8 text-sm text-center text-muted-foreground justify-center">
            Loading...
          </CommandItem>
        )}
        {!isLoading && <CommandEmpty className="py-8 text-muted-foreground">No results found.</CommandEmpty>}
        {items.map((item) => {
          if (item.type === "header") {
            return (
              <CommandItem
                key={item.label}
                disabled
                className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider !bg-transparent cursor-default"
              >
                {item.label}
              </CommandItem>
            );
          }

          const chat = item.chat;
          const relativeTime = getRelativeTime(parseISO(chat.createdAt as string));

          return (
            <CommandItem
              key={chat.id}
              onSelect={() => !editingChatId && !deletingChatId && handleSelect(chat.id)}
              value={chat.id}
              className="flex items-center justify-between !py-2 px-2 rounded-lg group hover:bg-accent/50 data-[selected=true]:bg-accent/70 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
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
                    className="bg-transparent border-none w-full font-medium text-foreground focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <span className="font-medium text-foreground truncate">
                    {chat.title || "New Chat"}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                {/* Timestamp - visible by default, hidden on hover */}
                <span className="text-xs text-muted-foreground group-hover:opacity-0 transition-opacity duration-200 min-w-fit">
                  {relativeTime} ago
                </span>

                {editingChatId === chat.id ? (
                  <div className="flex items-center gap-1">
                    <IconButton
                      icon={<Check size={14} />}
                      tooltip="Save changes"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConfirmEdit(chat.id);
                      }}
                      className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                    />
                    <IconButton
                      icon={<X size={14} />}
                      tooltip="Cancel editing"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelEdit(chat.id);
                      }}
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    />
                  </div>
                ) : deletingChatId === chat.id ? (
                  <div className="flex items-center gap-1">
                    <IconButton
                      icon={<Check size={14} />}
                      tooltip="Confirm delete"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(chat.id);
                      }}
                      className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                    />
                    <IconButton
                      icon={<X size={14} />}
                      tooltip="Cancel delete"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingChatId(null);
                      }}
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    {chat.parentChatId && (
                      <IconButton
                        icon={<Split size={14} />}
                        tooltip="Go to parent chat"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/chat/${chat.parentChatId}`);
                          onOpenChange(false);
                        }}
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                      />
                    )}
                    {/* Actions - hidden by default, visible on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1">
                      <IconButton
                        icon={<Edit size={14} />}
                        tooltip="Edit title"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(chat);
                        }}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      />
                      <IconButton
                        icon={<Trash2 size={14} />}
                        tooltip="Delete chat"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingChatId(chat.id);
                        }}
                        className="h-7 w-7 text-muted-foreground hover:text-red-600"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CommandItem>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
