"use client";

import {
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { Chat } from "@/generated/prisma";
import { useChats } from "@/hooks/use-chats";
import { differenceInCalendarDays, differenceInHours, differenceInMinutes, format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

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
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`;

  return format(date, "MMM d");
};

export function HistoryCommandPalette({ open, onOpenChange }: HistoryCommandPaletteProps) {
  const [query, setQuery] = useState("");
  const { chats, isLoading } = useChats(open, query);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSelect = (chatId: string) => {
    onOpenChange(false);
    startTransition(async () => {
      router.push(`/chat/${chatId}`);
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
      className="max-w-2xl rounded-2xl border shadow-2xl bg-background"
    >
      <div className="border-b border-border/20">
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
          <CommandItem disabled className="p-8 text-sm text-center text-muted-foreground justify-center font-mono">
            // Loading chat history...
          </CommandItem>
        )}
        {!isLoading && <CommandEmpty className="py-8 text-muted-foreground font-mono">// No chats found</CommandEmpty>}
        {items.map((item) => {
          if (item.type === "header") {
            return (
              <CommandItem
                key={item.label}
                disabled
                className="px-4 py-2 text-xs font-mono text-muted-foreground/80 !bg-transparent cursor-default"
              >
                // {item.label.toLowerCase()}
              </CommandItem>
            );
          }

          const chat = item.chat;
          const relativeTime = getRelativeTime(parseISO(chat.createdAt as string));

          return (
            <CommandItem
              key={chat.id}
              onSelect={() => handleSelect(chat.id)}
              value={chat.id}
              className="flex items-center justify-between !py-2 px-2 rounded-lg group hover:bg-accent/50 data-[selected=true]:bg-accent/70 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="font-medium text-foreground truncate">
                  {chat.title || "untitled chat"}
                </span>
              </div>

              <div className="flex items-center">
                <span className="text-xs font-mono text-muted-foreground/60 min-w-fit">
                  {relativeTime}
                </span>
              </div>
            </CommandItem>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
