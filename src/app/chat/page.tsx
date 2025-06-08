"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { ArrowUp, ChevronDown, Clipboard, Paperclip, RotateCw, Search, Share2, Split, SquarePen, TextSearch, Zap } from "lucide-react"

// Dummy JSON data structure
const chatData = {
  messages: [
    {
      id: 1,
      role: "user",
      content: "damnnnn",
      timestamp: new Date().toISOString()
    },
    {
      id: 2,
      role: "assistant",
      content: "Yo, what's got you so hyped? Spill the tea!",
      timestamp: "1.3s",
      actions: ["refresh", "copy", "share", "thumbsUp", "thumbsDown", "more"]
    }
  ],
  user: {
    name: "User",
    avatar: "https://github.com/shadcn.png"
  },
  settings: {
    model: "Gemini 2.5 Flash",
    availableModels: ["Gemini 2.5 Flash", "Gemini 2.5 Pro"],
    features: {
      search: true,
      think: true,
    }
  }
}

export default function ChatPage() {
  return (
    <div className="flex flex-col h-screen bg-muted">
      {/* Header */}
      <header className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-2">
          <span className="font-semibold">t0Chat</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon">
            <SquarePen size={20} />
          </Button>
          <Button variant="ghost" size="icon">
            <Share2 size={20} />
          </Button>
          <Button variant="ghost" size="icon">
            <TextSearch size={20} />
          </Button>
          <Avatar className="h-8 w-8">
            <AvatarImage src={chatData.user.avatar} alt={chatData.user.name} />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {chatData.messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'assistant' ? (
                <div className="flex flex-col gap-3 max-w-2xl">
                  <div className="">
                    {message.content}
                  </div>
                  <div className="flex items-center gap-x-1 text-muted-foreground">
                    <Button variant="ghost" size="sm">
                      <RotateCw size={16} />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Clipboard size={16} />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Split size={16} />
                    </Button>
                    <span className="text-xs ml-2">{message.timestamp}</span>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-2 rounded-2xl max-w-fit bg-background border">
                  <p className="text-sm">{message.content}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Input Footer */}
      <div className="p-4">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl p-2 border shadow-sm bg-background">
            {/* Top Part: Textarea */}
            <Textarea
              placeholder="How can t0Chat help?"
              className="w-full resize-none border-0 shadow-none bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0"
              rows={1}
            />
            {/* Bottom Part: Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-x-2">
                <Button variant="ghost" size="icon" className="h-10 w-10 flex-shrink-0 rounded-full">
                  <Paperclip size={20} />
                </Button>

                {chatData.settings.features.search && (
                  <Button variant="outline" size="sm" className="rounded-2xl">
                    <Search size={14} className="" />
                    Search
                  </Button>
                )}

                {chatData.settings.features.think && (
                  <Button variant="outline" size="sm" className="rounded-2xl">
                    <Zap size={16} className="" />
                    Think
                  </Button>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="rounded-2xl">
                      {chatData.settings.model}
                      <ChevronDown size={16} className="ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {chatData.settings.availableModels.map((model) => (
                      <DropdownMenuItem key={model}>
                        {model}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button size="icon" className="h-10 w-10 rounded-full">
                  <ArrowUp size={18} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}