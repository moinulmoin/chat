import { getSession } from "@/server/auth";
import { NavbarClient } from "./navbar-client";

export default async function Navbar() {
  const session = await getSession();
  return <NavbarClient user={session?.user ?? null} />;
}
