import Script from "next/script";

export function Analytics() {
  if (process.env.NODE_ENV !== "production") return null;
  return (
    <Script
      src="https://umami.moinulmoin.com/script.js"
      data-website-id="983f1426-7855-4520-93a8-bc7e10090a5e"
    />
  );
}
