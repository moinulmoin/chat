"use client";

import { Button } from "@/components/ui/button";
import { UIMessage } from "ai";
import { Share2, Terminal } from "lucide-react";
import { toast } from "sonner";
import { ShareChatMessage } from "./share-chat-message";

export function ShareChatClient({
  initialMessages,
  title,
  author
}: {
  initialMessages: UIMessage[];
  title: string;
  author: string;
}) {
  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).then(() => {
        toast.success("Share link copied to clipboard");
      }).catch(() => {
        toast.error("Failed to copy link");
      });
    }
  };

    return (
    <div className="min-h-screen bg-background">
      {/* Clean Header */}
      <div className="border-b bg-background">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Terminal className="w-5 h-5 text-primary" />
              <div>
                <h1 className="font-semibold text-foreground">{title}</h1>
                <p className="text-sm text-muted-foreground">by {author}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="flex items-center gap-1.5"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              <Button
                variant="default"
                size="sm"
                asChild
              >
                <a href="/chat" className="flex items-center gap-1.5">
                  <Terminal className="w-4 h-4" />
                  Start Chatting
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {initialMessages.map((message) => (
            <ShareChatMessage key={message.id} message={message} />
          ))}
        </div>
      </div>
    </div>
  );
}