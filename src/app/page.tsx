import { getSession } from "@/server/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getSession();
  if (session?.user) {
    redirect("/chat");
  } else {
    redirect("/signin");
  }
}
