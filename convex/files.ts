import { mutation, query } from "./_generated/server"
import { v } from "convex/values"
import { r2 } from "./r2"

// Save file record after R2 upload (syncMetadata must have run first)
export const saveFile = mutation({
  args: {
    r2Key: v.string(),
    name: v.string(),
    size: v.number(),
    mimeType: v.string(),
    linkedPageId: v.optional(v.id("pages")),
  },
  handler: async (ctx, args) => {
    // getMetadata reads from Convex tables populated by syncMetadata
    const metadata = await r2.getMetadata(ctx, args.r2Key)
    const url = metadata?.url ?? ""

    return await ctx.db.insert("files", {
      storageId: args.r2Key,
      url,
      name: args.name,
      size: args.size,
      mimeType: args.mimeType,
      linkedPageId: args.linkedPageId,
      uploadedAt: Date.now(),
    })
  },
})

// Get the stored URL for a file (reads from R2 component's Convex table)
export const getUrl = query({
  args: { r2Key: v.string() },
  handler: async (ctx, args) => {
    const metadata = await r2.getMetadata(ctx, args.r2Key)
    return metadata?.url ?? null
  },
})

// List files for a page with their current URLs
export const listByPage = query({
  args: { pageId: v.id("pages") },
  handler: async (ctx, args) => {
    const files = await ctx.db
      .query("files")
      .filter((q) => q.eq(q.field("linkedPageId"), args.pageId))
      .collect()

    return Promise.all(
      files.map(async (file) => {
        const metadata = await r2.getMetadata(ctx, file.storageId)
        return { ...file, url: metadata?.url ?? file.url }
      })
    )
  },
})

// Delete a file from R2 and the database
export const remove = mutation({
  args: { fileId: v.id("files") },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId)
    if (file) {
      await r2.deleteObject(ctx, file.storageId)
      await ctx.db.delete(args.fileId)
    }
  },
})
