import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

// Generate a Convex storage upload URL
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl()
  },
})

// Save file record after upload
export const saveFile = mutation({
  args: {
    storageId: v.string(),
    name: v.string(),
    size: v.number(),
    mimeType: v.string(),
    linkedPageId: v.optional(v.id("pages")),
  },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storageId)
    if (!url) throw new Error("Failed to get file URL")

    return await ctx.db.insert("files", {
      storageId: args.storageId,
      url,
      name: args.name,
      size: args.size,
      mimeType: args.mimeType,
      linkedPageId: args.linkedPageId,
      uploadedAt: Date.now(),
    })
  },
})

// Get file URL
export const getUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId)
  },
})

// List files for a page
export const listByPage = query({
  args: { pageId: v.id("pages") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("files")
      .filter((q) => q.eq(q.field("linkedPageId"), args.pageId))
      .collect()
  },
})

// Delete file
export const remove = mutation({
  args: { fileId: v.id("files") },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId)
    if (file) {
      await ctx.storage.delete(file.storageId)
      await ctx.db.delete(args.fileId)
    }
  },
})
