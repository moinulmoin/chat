import { ChatHeader } from "@/components/chat-header";

function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen bg-secondary">
      <ChatHeader />

      {children}
    </div>
  );
}

export default ChatLayout;
