import { getSession } from "@/server/auth";
import { redirect } from "next/navigation";

async function ChatLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/signin");
  }

  return (
    <div className="flex flex-col bg-secondary min-h-screen">
      {children}
    </div>
  );
}

export default ChatLayout;
