import { internalQuery, query } from "./_generated/server";

// Internal query: get the INVITE_KEY setting value
export const getInviteKeyInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    const setting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "INVITE_KEY"))
      .first();
    return setting?.value ?? null;
  },
});

// Internal query: get total user count from Better Auth user table
// Used to detect first-time setup (0 users = allow admin bootstrap)
export const getBetterAuthUserCountInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("user").collect();
    return users.length;
  },
});

// Public query: get user count from Better Auth user table
// Used by auth page to detect setup mode
export const getUserCount = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("user").collect();
    return users.length;
  },
});

// Public query: list all Better Auth users
export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("user").collect();
  },
});
