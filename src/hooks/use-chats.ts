import { Chat } from "@/generated/prisma";
import { swrKeys } from "@/lib/keys";
import useSWRInfinite from "swr/infinite";

type ChatWithDate = Chat & {
  createdAt: string | Date;
  updatedAt: string | Date;
  parentChatId?: string | null;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useChats(enabled: boolean, query: string) {
  const { data, mutate, error, isLoading, setSize, size } = useSWRInfinite<
    ChatWithDate[]
  >(
    enabled ? (pageIndex, previousPageData) => swrKeys.chats(pageIndex, previousPageData, query) : () => null,
    fetcher
  );

  const chats = data ? data.flat() : [];
  const hasMore = data ? data[data.length - 1].length > 0 : true;

  return {
    chats,
    mutate,
    error,
    isLoading,
    setSize,
    size,
    hasMore,
  };
}