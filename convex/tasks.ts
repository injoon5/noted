import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// List all tasks ordered by order
export const list = query({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db.query("tasks").collect();
    return tasks.sort((a, b) => a.order - b.order);
  },
});

// Count tasks due today that aren't done
export const getTodayCount = query({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_due_date")
      .filter((q) =>
        q.and(
          q.gte(q.field("dueDate"), startOfDay),
          q.lte(q.field("dueDate"), endOfDay),
          q.neq(q.field("status"), "done")
        )
      )
      .collect();

    return tasks.length;
  },
});

// Get tasks due today
export const getTodayTasks = query({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_due_date")
      .filter((q) =>
        q.and(
          q.gte(q.field("dueDate"), startOfDay),
          q.lte(q.field("dueDate"), endOfDay)
        )
      )
      .collect();

    return tasks.sort((a, b) => a.order - b.order);
  },
});

// Get upcoming tasks (future, not done)
export const getUpcoming = query({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() + 24 * 60 * 60 * 1000;

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_due_date")
      .filter((q) =>
        q.and(
          q.gt(q.field("dueDate"), endOfDay),
          q.neq(q.field("status"), "done")
        )
      )
      .collect();

    return tasks.sort((a, b) => (a.dueDate ?? 0) - (b.dueDate ?? 0));
  },
});

// Create task
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    status: v.optional(v.union(v.literal("todo"), v.literal("in_progress"), v.literal("done"))),
    dueDate: v.optional(v.number()),
    linkedPageId: v.optional(v.id("pages")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db.query("tasks").collect();
    const maxOrder = existing.reduce((max, t) => Math.max(max, t.order), -1);

    return await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      status: args.status ?? "todo",
      dueDate: args.dueDate,
      linkedPageId: args.linkedPageId,
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update task
export const update = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.union(v.literal("todo"), v.literal("in_progress"), v.literal("done"))),
    dueDate: v.optional(v.number()),
    linkedPageId: v.optional(v.id("pages")),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { taskId, ...updates } = args;
    const filtered: Record<string, unknown> = {};

    for (const [key, val] of Object.entries(updates)) {
      if (val !== undefined) {
        filtered[key] = val;
      }
    }

    filtered.updatedAt = Date.now();
    await ctx.db.patch(taskId, filtered);
  },
});

// Delete task
export const remove = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.taskId);
  },
});

// Reorder tasks
export const reorder = mutation({
  args: {
    taskIds: v.array(v.id("tasks")),
  },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.taskIds.length; i++) {
      await ctx.db.patch(args.taskIds[i], { order: i, updatedAt: Date.now() });
    }
  },
});
