"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { IconButton } from "@/components/ui/icon-button";
import { Textarea } from "@/components/ui/textarea";
import { chatData } from "@/lib/utils";
import { ChatStatus } from "ai";
import { ArrowUp, Brain, ChevronDown, Globe, Paperclip } from "lucide-react";
import { useRef } from "react";

interface ChatInputProps {
  onSubmit: (text: string) => void;
  placeholder?: string;
  status: ChatStatus;
}

export function ChatInput({ onSubmit, placeholder = "How can t0Chat help?", status }: ChatInputProps) {
  const userInputRef = useRef<HTMLTextAreaElement>(null);
  const { settings } = chatData;

  const handleSubmit = () => {
    const text = userInputRef.current?.value || "";
    if (text.trim()) {
      onSubmit(text);
      if (userInputRef.current) {
        userInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="p-4">
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl p-2 border shadow-sm bg-background">
          {/* Top Part: Textarea */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="flex-1"
          >
            <Textarea
              ref={userInputRef}
              placeholder={placeholder}
              className="w-full resize-none border-0 p-2 shadow-none bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0 h-auto"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </form>
          {/* Bottom Part: Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-2">
              <IconButton
                variant="ghost"
                size="icon"
                className="h-10 w-10 flex-shrink-0 rounded-full"
                icon={<Paperclip size={20} />}
                tooltip="Attach file"
              />

              {settings.features.search && (
                <Button variant="outline" size="sm" className="rounded-2xl">
                  <Globe size={14} className="" />
                  Search
                </Button>
              )}

              {settings.features.think && (
                <Button variant="outline" size="sm" className="rounded-2xl">
                  <Brain size={15} className="" />
                  Think
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="rounded-2xl">
                    {settings.model}
                    <ChevronDown size={16} className="ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {settings.availableModels.map((model) => (
                    <DropdownMenuItem key={model}>{model}</DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <IconButton
                size="icon"
                className="h-9 w-9 rounded-full"
                icon={<ArrowUp className=" size-5" />}
                tooltip="Send message"
                onClick={handleSubmit}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
