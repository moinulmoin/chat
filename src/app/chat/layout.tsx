import { Header } from "@/components/header";

function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col bg-secondary min-h-screen">
      <Header />
      {children}
    </div>
  );
}

export default ChatLayout;
