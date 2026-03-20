import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// List pages by spaceId
export const list = query({
  args: { spaceId: v.id("spaces") },
  handler: async (ctx, args) => {
    const pages = await ctx.db
      .query("pages")
      .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
      .collect();
    return pages.sort((a, b) => a.order - b.order);
  },
});

// List pages by parentId
export const listByParent = query({
  args: { parentId: v.id("pages") },
  handler: async (ctx, args) => {
    const pages = await ctx.db
      .query("pages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .collect();
    return pages.sort((a, b) => a.order - b.order);
  },
});

// Get single page by id
export const get = query({
  args: { pageId: v.id("pages") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.pageId);
  },
});

// Get public page by shareToken
export const getByShareToken = query({
  args: { shareToken: v.string() },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("pages")
      .withIndex("by_share_token", (q) => q.eq("shareToken", args.shareToken))
      .first();

    if (!page || !page.isPublic) return null;
    return page;
  },
});

// Create new page
export const create = mutation({
  args: {
    spaceId: v.id("spaces"),
    parentId: v.optional(v.id("pages")),
    title: v.string(),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get max order among siblings
    let siblings;
    if (args.parentId) {
      siblings = await ctx.db
        .query("pages")
        .withIndex("by_parent", (q) => q.eq("parentId", args.parentId!))
        .collect();
    } else {
      siblings = await ctx.db
        .query("pages")
        .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
        .filter((q) => q.eq(q.field("parentId"), undefined))
        .collect();
    }
    const maxOrder = siblings.reduce((max, p) => Math.max(max, p.order), -1);

    return await ctx.db.insert("pages", {
      spaceId: args.spaceId,
      parentId: args.parentId,
      title: args.title,
      icon: args.icon,
      content: "",
      order: maxOrder + 1,
      isPublic: false,
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update page
export const update = mutation({
  args: {
    pageId: v.id("pages"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    icon: v.optional(v.string()),
    isFavorite: v.optional(v.boolean()),
    isPublic: v.optional(v.boolean()),
    coverImage: v.optional(v.string()),
    order: v.optional(v.number()),
    shareToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { pageId, ...updates } = args;
    const filtered: Record<string, unknown> = {};

    for (const [key, val] of Object.entries(updates)) {
      if (val !== undefined) {
        filtered[key] = val;
      }
    }

    filtered.updatedAt = Date.now();
    await ctx.db.patch(pageId, filtered);
  },
});

// Delete page and all children recursively
async function deletePageRecursive(
  ctx: { db: { delete: (id: Id<"pages">) => Promise<void>; query: (tableName: "pages") => unknown } },
  pageId: Id<"pages">
) {
  // Get all children
  const children = await (ctx.db.query("pages") as ReturnType<typeof ctx.db.query>)
    .withIndex("by_parent", (q: { eq: (field: string, val: Id<"pages">) => unknown }) =>
      q.eq("parentId", pageId)
    )
    .collect();

  for (const child of children) {
    await deletePageRecursive(ctx, child._id);
  }

  await ctx.db.delete(pageId);
}

// Remove page and children
export const remove = mutation({
  args: { pageId: v.id("pages") },
  handler: async (ctx, args) => {
    const children = await ctx.db
      .query("pages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.pageId))
      .collect();

    for (const child of children) {
      await removeChildren(ctx, child._id);
      await ctx.db.delete(child._id);
    }

    await ctx.db.delete(args.pageId);
  },
});

async function removeChildren(
  ctx: Parameters<Parameters<typeof mutation>[0]["handler"]>[0],
  pageId: Id<"pages">
) {
  const children = await ctx.db
    .query("pages")
    .withIndex("by_parent", (q) => q.eq("parentId", pageId))
    .collect();

  for (const child of children) {
    await removeChildren(ctx, child._id);
    await ctx.db.delete(child._id);
  }
}

// Full text search
export const search = query({
  args: {
    query: v.string(),
    spaceId: v.optional(v.id("spaces")),
  },
  handler: async (ctx, args) => {
    if (!args.query.trim()) return [];

    // Search by title
    const titleResults = await ctx.db
      .query("pages")
      .searchIndex("search_title", (q) => q.search("title", args.query))
      .take(20);

    // If spaceId provided, also search content
    let contentResults: typeof titleResults = [];
    if (args.spaceId) {
      contentResults = await ctx.db
        .query("pages")
        .searchIndex("search_content", (q) =>
          q.search("content", args.query).eq("spaceId", args.spaceId!)
        )
        .take(10);
    }

    // Merge and deduplicate
    const seen = new Set<string>();
    const results = [];

    for (const page of [...titleResults, ...contentResults]) {
      if (!seen.has(page._id)) {
        seen.add(page._id);
        results.push(page);
      }
    }

    return results.slice(0, 20);
  },
});

// Get all favorited pages
export const getFavorites = query({
  args: {},
  handler: async (ctx) => {
    const pages = await ctx.db.query("pages").collect();
    return pages
      .filter((p) => p.isFavorite)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

// Move page to different space/parent
export const move = mutation({
  args: {
    pageId: v.id("pages"),
    spaceId: v.id("spaces"),
    parentId: v.optional(v.id("pages")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.pageId, {
      spaceId: args.spaceId,
      parentId: args.parentId,
      updatedAt: Date.now(),
    });
  },
});
