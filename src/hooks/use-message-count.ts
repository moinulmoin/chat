import { swrKeys } from "@/lib/keys";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useMessageCount(chatId: string | undefined) {
  const { data, error, isLoading } = useSWR<{ count: number }>(
    chatId ? swrKeys.messageCount(chatId) : null,
    fetcher
  );

  return {
    count: data?.count,
    error,
    isLoading,
  };
}