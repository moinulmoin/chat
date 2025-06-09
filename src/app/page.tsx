import { isAuthenticated } from "@/convex/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  if (isAuthenticated) {
    redirect("/chat");
  } else {
    redirect("/signin");
  }
}
