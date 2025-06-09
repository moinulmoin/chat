"use client";

import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";

const convexClient = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!, { verbose: true });

function AuthProvider({ children }: { children: React.ReactNode }) {
  return <ConvexAuthNextjsProvider client={convexClient}>{children}</ConvexAuthNextjsProvider>;
}

export { AuthProvider };
