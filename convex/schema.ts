import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,
  chats: defineTable({
    userId: v.id("users"),
    title: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number()
  }).index("by_user", ["userId"]),
  streams: defineTable({
    chatId: v.id("chats")
  }).index("by_chat", ["chatId"]),
  messages: defineTable({
    chatId: v.id("chats"),
    role: v.string(),
    parts: v.array(v.any()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_chat", ["chatId"])
    .index("by_chat_created", ["chatId", "createdAt"]),

  attachments: defineTable({
    userId: v.id("users"),
    messageId: v.id("messages"),
    storageId: v.string(), // To link to Convex file storage
    fileName: v.string(),
    fileType: v.string(), // e.g., "application/pdf", "image/png"
    createdAt: v.number(),
    updatedAt: v.number()
  }).index("by_message", ["messageId"])
});

export default schema;
