import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get overall stats
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const [spaces, pages, tasks, files, users] = await Promise.all([
      ctx.db.query("spaces").collect(),
      ctx.db.query("pages").collect(),
      ctx.db.query("tasks").collect(),
      ctx.db.query("files").collect(),
      ctx.db.query("users").collect(),
    ]);

    const publicPages = pages.filter((p) => p.isPublic).length;

    return {
      spaces: spaces.length,
      pages: pages.length,
      tasks: tasks.length,
      files: files.length,
      users: users.length,
      publicPages,
    };
  },
});

// Get recent activity
export const getRecentActivity = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const [pages, tasks, files] = await Promise.all([
      ctx.db.query("pages").collect(),
      ctx.db.query("tasks").collect(),
      ctx.db.query("files").collect(),
    ]);

    type ActivityItem = {
      type: "page_edit" | "task_complete" | "file_upload";
      id: string;
      title: string;
      timestamp: number;
      meta?: string;
    };

    const activity: ActivityItem[] = [];

    // Recent page edits
    for (const page of pages) {
      activity.push({
        type: "page_edit",
        id: page._id,
        title: page.title || "Untitled",
        timestamp: page.updatedAt,
      });
    }

    // Completed tasks
    for (const task of tasks) {
      if (task.status === "done") {
        activity.push({
          type: "task_complete",
          id: task._id,
          title: task.title,
          timestamp: task.updatedAt,
        });
      }
    }

    // File uploads
    for (const file of files) {
      activity.push({
        type: "file_upload",
        id: file._id,
        title: file.name,
        timestamp: file.uploadedAt,
        meta: file.mimeType,
      });
    }

    return activity
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  },
});

// Regenerate invite key
export const regenerateInviteKey = mutation({
  args: { newKey: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "INVITE_KEY"))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { value: args.newKey });
    } else {
      await ctx.db.insert("settings", { key: "INVITE_KEY", value: args.newKey });
    }

    return { success: true };
  },
});

// Export data (placeholder)
export const exportData = query({
  args: {},
  handler: async (ctx) => {
    const [spaces, pages, tasks] = await Promise.all([
      ctx.db.query("spaces").collect(),
      ctx.db.query("pages").collect(),
      ctx.db.query("tasks").collect(),
    ]);

    return {
      exportedAt: Date.now(),
      spaces,
      pages,
      tasks,
    };
  },
});
