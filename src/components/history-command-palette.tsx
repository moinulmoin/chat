"use client";

import { deleteChat, updateChatTitle } from "@/app/actions";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Chat } from "@/generated/prisma";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { Check, Edit, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

type ChatWithDate = Chat & {
    createdAt: string | Date;
    updatedAt: string | Date;
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

  const handleTitleChange = (chatId: string) => {
    if (!newTitle.trim()) return;
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
        {Object.entries(groupedChats).map(([date, chats]) => (
          <CommandGroup key={date} heading={date} className="">
            {chats.map((chat) => (
              <CommandItem
                key={chat.id}
                onSelect={() => !editingChatId && !deletingChatId && handleSelect(chat.id)}
                className="flex justify-between items-center !py-1"
              >
                {editingChatId === chat.id ? (
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onBlur={() => handleTitleChange(chat.id)}
                    onKeyDown={(e) => e.key === "Enter" && handleTitleChange(chat.id)}
                    className="bg-transparent border-none w-full"
                    autoFocus
                  />
                ) : (
                  <span>{chat.title || "New Chat"}</span>
                )}
                <div className="flex items-center">
                  {deletingChatId === chat.id ? (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(chat.id);
                        }}
                        className="p-1 rounded"
                        title="Confirm delete"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingChatId(null);
                        }}
                        className="p-1 rounded"
                        title="Cancel delete"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      {editingChatId !== chat.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingChatId(chat.id);
                            setNewTitle(chat.title || "");
                          }}
                          className="p-1 rounded"
                        >
                          <Edit size={16} />
                        </button>
                      )}
                      {editingChatId !== chat.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingChatId(chat.id);
                          }}
                          className="p-1 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </>
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