export const swrKeys = {
  chats: (pageIndex: number, previousPageData: any) => {
    if (previousPageData && !previousPageData.length) return null;
    return `/api/chats?page=${pageIndex + 1}&limit=20`;
  },
  messageCount: (chatId: string) => `/api/chats/${chatId}/messages/count`,
};