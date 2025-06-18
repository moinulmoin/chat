export const swrKeys = {
  chats: (pageIndex: number, previousPageData: any, query: string) => {
    if (previousPageData && !previousPageData.length) return null;
    const searchParams = new URLSearchParams();
    searchParams.append("page", (pageIndex + 1).toString());
    searchParams.append("limit", "20");
    if (query) {
      searchParams.append("title", query);
    }
    return `/api/chats?${searchParams.toString()}`;
  },
  messageCount: (chatId: string) => `/api/chats/${chatId}/messages/count`,
};