"use client";

import { Button } from "@/components/ui/button";
import { useAuthActions } from "@convex-dev/auth/react";
import { Github, Loader2 } from "lucide-react";
import { useState } from "react";

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuthActions();

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-muted-foreground">Sign in to your account to continue</p>
        <Button onClick={() => {
          setIsLoading(true);
          void signIn("github", {
            redirectTo: "/chat",
          });
        }}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Github className="h-4 w-4" />}
          Sign in with GitHub
        </Button>
      </div>
    </div>
  );
}
