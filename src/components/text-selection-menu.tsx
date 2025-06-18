"use client";

import { Button } from "@/components/ui/button";
import { Lightbulb, MessageSquarePlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface TextSelectionMenuProps {
  onAddToChat: (text: string) => void;
  onExplain: (text: string) => void;
}

export function TextSelectionMenu({ onAddToChat, onExplain }: TextSelectionMenuProps) {
  const [selectedText, setSelectedText] = useState("");
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        setMenuPosition(null);
        setSelectedText("");
        return;
      }

      const text = selection.toString().trim();
      if (!text) {
        setMenuPosition(null);
        setSelectedText("");
        return;
      }

      // Check if the selection is inside an assistant message
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      const messageElement = (container.nodeType === Node.TEXT_NODE
        ? container.parentElement
        : container as Element)?.closest('[data-role="assistant"]');

      if (!messageElement) {
        setMenuPosition(null);
        setSelectedText("");
        return;
      }

      setSelectedText(text);

      // Get the position for the context menu
      const rect = range.getBoundingClientRect();
      const x = rect.left + (rect.width / 2);
      const y = rect.bottom + 8; // 8px below the selection

      setMenuPosition({ x, y });
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuPosition(null);
        setSelectedText("");
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleAddToChat = () => {
    onAddToChat(selectedText);
    setMenuPosition(null);
    setSelectedText("");
    // Clear selection
    window.getSelection()?.removeAllRanges();
  };

  const handleExplain = () => {
    onExplain(selectedText);
    setMenuPosition(null);
    setSelectedText("");
    // Clear selection
    window.getSelection()?.removeAllRanges();
  };

  if (!menuPosition || !selectedText) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-background border rounded-lg shadow-md p-1 flex gap-1"
      style={{
        left: `${menuPosition.x}px`,
        top: `${menuPosition.y}px`,
        transform: "translateX(-50%)",
      }}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={handleAddToChat}
        className="flex items-center gap-2 text-xs h-8"
      >
        <MessageSquarePlus className="size-3.5" />
        Add to chat
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleExplain}
        className="flex items-center gap-2 text-xs h-8"
      >
        <Lightbulb className="size-3.5" />
        Explain this
      </Button>
    </div>
  );
}