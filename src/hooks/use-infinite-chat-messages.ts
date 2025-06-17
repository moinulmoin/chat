import { UIMessage } from "ai";
import useSWRInfinite from "swr/infinite";

const PAGE_SIZE = 30;

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useInfiniteChatMessages(chatId: string) {
  const { data, size, setSize, isValidating } = useSWRInfinite<UIMessage[]>(
    // pageIndex 0 == API page 2 because page 1 is already SSR-fetched
    (index, prev) =>
      prev && prev.length < PAGE_SIZE
        ? null
        : `/api/chats/${chatId}/messages?page=${index + 2}&limit=${PAGE_SIZE}`,
    fetcher,
    { revalidateFirstPage: false }
  );

  const older = data ? [...data].reverse().flat() : [];
  const hasMore = data ? data[data.length - 1]?.length === PAGE_SIZE : true;

  return {
    olderMessages: older,
    loadMore: () => setSize(size + 1),
    hasMore,
    loadingMore: isValidating
  };
}