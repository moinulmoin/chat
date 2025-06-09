import { api } from "@/convex/_generated/api";
import { redirect } from "next/navigation";

export default async function Home() {
  const isAuthenticated = api.auth.isAuthenticated;

  if (isAuthenticated) {
    redirect("/chat");
  } else {
    redirect("/signin");
  }
}
