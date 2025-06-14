import { tool } from "ai";
import { z } from "zod";
import { tavily } from "@tavily/core";

export const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY });

export const webSearch = tool({
  description: "Search the web for up-to-date information",
  parameters: z.object({
    query: z.string().min(1).describe("The search query")
  }),
  execute: async ({ query }) => {
    const { results } = await tavilyClient.search(query, {
      numResults: 3,
      includeRawContent: "markdown"
    });
    return results.map((result) => ({
      title: result.title,
      url: result.url,
      content: result.content,
      publishedDate: result.publishedDate
    }));
  }
});

export const tools = {
  webSearch
};
