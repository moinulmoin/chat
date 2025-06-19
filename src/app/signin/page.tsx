"use client";

import { Button } from "@/components/ui/button";
import { signInWithGitHub } from "@/lib/auth-client";
import { Github, Loader2, Terminal } from "lucide-react";
import { useState } from "react";

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);

    return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-6 text-center">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <Terminal className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-mono font-medium">/chat</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Navigate with commands, not clicks
          </p>
        </div>

        {/* Auth Button */}
        <Button
          onClick={async () => {
            setIsLoading(true);
            await signInWithGitHub();
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Github className="h-4 w-4 mr-2" />
          )}
          {isLoading ? "Connecting..." : "Sign in with GitHub"}
        </Button>
      </div>
    </div>
  );
}
