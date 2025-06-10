import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getLastStreamIdByChatId = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const streams = await ctx.db
      .query("streams")
      .filter((q) => q.eq(q.field("chatId"), args.chatId))
      .order("desc")
      .first();
    return streams?._id;
  }
});

export const createStreamId = mutation({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const streamId = await ctx.db.insert("streams", { chatId: args.chatId });
    return streamId;
  }
});

export const saveLastMessage = mutation({
  args: { chatId: v.id("chats"), message: v.any(), role: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", { chatId: args.chatId, role: args.role, parts: args.message, createdAt: Date.now(), updatedAt: Date.now()  });
  }
});

export const getLastMessageByChatId = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const message = await ctx.db.query("messages").filter((q) => q.eq(q.field("chatId"), args.chatId)).order("desc").first();
    return message;
  }
});

export const loadChat = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const messages = await ctx.db.query("messages").filter((q) => q.eq(q.field("chatId"), args.chatId)).order("desc").collect();

    return messages;
  }
});

export const getChatById = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const chat = await ctx.db.query("chats").filter((q) => q.eq(q.field("_id"), args.chatId)).first();
    return chat;
  }
});

export const createChat = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }
    const chat = await ctx.db.insert("chats", { createdAt: Date.now(), updatedAt: Date.now(), userId: userId });
    return chat;
  }
});