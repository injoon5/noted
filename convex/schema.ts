import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { tables as betterAuthTables } from "./betterAuth/schema";

export default defineSchema({
  // Better Auth tables (user, session, account, verification)
  ...betterAuthTables,

  spaces: defineTable({
    title: v.string(),
    icon: v.optional(v.string()),
    order: v.number(),
    ownerId: v.string(),
    isPublic: v.boolean(),
    shareToken: v.optional(v.string()),
  }),

  pages: defineTable({
    spaceId: v.id("spaces"),
    parentId: v.optional(v.id("pages")),
    title: v.string(),
    icon: v.optional(v.string()),
    content: v.string(),
    order: v.number(),
    isPublic: v.boolean(),
    shareToken: v.optional(v.string()),
    isFavorite: v.boolean(),
    coverImage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_space", ["spaceId"])
    .index("by_parent", ["parentId"])
    .index("by_share_token", ["shareToken"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["spaceId"],
    })
    .searchIndex("search_title", {
      searchField: "title",
    }),

  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("done")
    ),
    dueDate: v.optional(v.number()),
    linkedPageId: v.optional(v.id("pages")),
    order: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_due_date", ["dueDate"])
    .index("by_status", ["status"]),

  files: defineTable({
    storageId: v.string(),
    url: v.string(),
    name: v.string(),
    size: v.number(),
    mimeType: v.string(),
    linkedPageId: v.optional(v.id("pages")),
    uploadedAt: v.number(),
  }),

  settings: defineTable({
    key: v.string(),
    value: v.string(),
  }).index("by_key", ["key"]),

  offlinePages: defineTable({
    pageId: v.id("pages"),
    userId: v.string(),
    cachedAt: v.number(),
  }).index("by_user", ["userId"]),
});
