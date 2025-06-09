import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,
  chats: defineTable({
    userId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    messages: v.array(
      v.object({
        id: v.id("messages"),
        content: v.string(),
        createdAt: v.number()
      })
    )
  })
    .index("by_user", ["userId"]),
  messages: defineTable({
    chatId: v.id("chats"),
    content: v.string(),
    createdAt: v.number()
  })
    .index("by_chat", ["chatId"])
});

export default schema;
