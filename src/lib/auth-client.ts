import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL as string
});

export const signInWithGitHub = async () => {
  const data = await authClient.signIn.social({
      provider: "github",
  })
}

export const signOut = async () => {
  await authClient.signOut();
  window.location.href = "/signin";
}