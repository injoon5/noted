import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Bootstrap: create first admin user (requires SETUP_KEY)
export const bootstrap = mutation({
  args: {
    name: v.string(),
    setupKey: v.string(),
  },
  handler: async (ctx, args) => {
    // Check no users exist
    const existingUsers = await ctx.db.query("users").collect();
    if (existingUsers.length > 0) {
      throw new Error("Setup already completed");
    }

    // Verify setup key from settings or env-injected setting
    const setupKeySetting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "SETUP_KEY"))
      .first();

    // If no setting exists yet, we allow first bootstrap with any key
    // In production, the SETUP_KEY would be set via env variable
    if (setupKeySetting && setupKeySetting.value !== args.setupKey) {
      throw new Error("Invalid setup key");
    }

    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      name: args.name,
      role: "admin",
      createdAt: now,
    });

    // Store the invite key placeholder
    await ctx.db.insert("settings", {
      key: "SETUP_KEY",
      value: args.setupKey,
    });

    return userId;
  },
});

// Register: create new member user (requires INVITE_KEY)
export const register = mutation({
  args: {
    name: v.string(),
    inviteKey: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify invite key
    const inviteKeySetting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "INVITE_KEY"))
      .first();

    if (!inviteKeySetting || inviteKeySetting.value !== args.inviteKey) {
      throw new Error("Invalid invite key");
    }

    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      name: args.name,
      role: "member",
      createdAt: now,
    });

    return userId;
  },
});

// SignIn: find user by name (simple name-based auth)
export const signIn = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    return user._id;
  },
});

// Get user by id
export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// List all users (admin only - enforced client side for now)
export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

// Get user count (to determine if setup is needed)
export const getUserCount = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.length;
  },
});
