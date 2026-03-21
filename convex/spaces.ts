import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// List all spaces ordered by order (scoped to the current user)
export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const spaces = await ctx.db.query("spaces").collect();
    return spaces
      .filter((s) => s.ownerId === identity.subject)
      .sort((a, b) => a.order - b.order);
  },
});

// Get single space by id
export const get = query({
  args: { spaceId: v.id("spaces") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.spaceId);
  },
});

// Create new space
export const create = mutation({
  args: {
    title: v.string(),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db.query("spaces").collect();
    const maxOrder = existing.reduce((max, s) => Math.max(max, s.order), -1);

    return await ctx.db.insert("spaces", {
      title: args.title,
      icon: args.icon,
      order: maxOrder + 1,
      ownerId: identity.subject,
      isPublic: false,
    });
  },
});

// Update space
export const update = mutation({
  args: {
    spaceId: v.id("spaces"),
    title: v.optional(v.string()),
    icon: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    shareToken: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const space = await ctx.db.get(args.spaceId);
    if (!space || space.ownerId !== identity.subject) throw new Error("Forbidden");

    const { spaceId, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(spaceId, filtered);
  },
});

// Remove space and all its pages
export const remove = mutation({
  args: { spaceId: v.id("spaces") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const space = await ctx.db.get(args.spaceId);
    if (!space || space.ownerId !== identity.subject) throw new Error("Forbidden");

    // Delete all pages in the space
    const pages = await ctx.db
      .query("pages")
      .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
      .collect();

    for (const page of pages) {
      await ctx.db.delete(page._id);
    }

    await ctx.db.delete(args.spaceId);
  },
});

// Reorder spaces
export const reorder = mutation({
  args: {
    spaceIds: v.array(v.id("spaces")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    for (let i = 0; i < args.spaceIds.length; i++) {
      const space = await ctx.db.get(args.spaceIds[i]);
      if (!space || space.ownerId !== identity.subject) throw new Error("Forbidden");
      await ctx.db.patch(args.spaceIds[i], { order: i });
    }
  },
});
