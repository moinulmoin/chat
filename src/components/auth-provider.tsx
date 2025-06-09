"use client"

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";

const convexClient = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function AuthProvider({ children }: { children: React.ReactNode }) {
  return <ConvexAuthProvider client={convexClient}>
    {children}
  </ConvexAuthProvider>
}

export { AuthProvider };
