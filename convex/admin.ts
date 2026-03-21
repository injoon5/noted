import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get overall stats (admin only)
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db.get(identity.subject as Id<"user">);
    if (user?.role !== "admin") return null;

    const [spaces, pages, tasks, files, users] = await Promise.all([
      ctx.db.query("spaces").collect(),
      ctx.db.query("pages").collect(),
      ctx.db.query("tasks").collect(),
      ctx.db.query("files").collect(),
      ctx.db.query("user").collect(),
    ]);

    const fileSize = files.reduce((sum, f) => sum + f.size, 0);
    const publicPageCount = pages.filter((p) => p.isPublic).length;

    return {
      spaceCount: spaces.length,
      pageCount: pages.length,
      taskCount: tasks.length,
      fileSize,
      publicPageCount,
      userCount: users.length,
    };
  },
});

// Get recent activity (admin only)
export const getRecentActivity = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db.get(identity.subject as Id<"user">);
    if (user?.role !== "admin") return null;

    const [recentPages, recentTasks, recentFiles] = await Promise.all([
      ctx.db.query("pages").order("desc").take(7),
      ctx.db.query("tasks").order("desc").take(7),
      ctx.db.query("files").order("desc").take(6),
    ]);

    const items: Array<{ icon: string; description: string; timestamp: number }> = [];

    for (const page of recentPages) {
      items.push({
        icon: page.icon ?? "📄",
        description: `Page "${page.title || "Untitled"}" edited`,
        timestamp: page.updatedAt,
      });
    }

    for (const task of recentTasks) {
      if (task.status === "done") {
        items.push({
          icon: "✅",
          description: `Task "${task.title}" completed`,
          timestamp: task.updatedAt,
        });
      }
    }

    for (const file of recentFiles) {
      items.push({
        icon: "📎",
        description: `File "${file.name}" uploaded`,
        timestamp: file.uploadedAt,
      });
    }

    return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);
  },
});

// Regenerate invite key — admin only, cryptographically random
export const regenerateInviteKey = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const user = await ctx.db.get(identity.subject as Id<"user">);
    if (user?.role !== "admin") throw new Error("Forbidden: admin only");

    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const newKey = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 21);

    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "INVITE_KEY"))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { value: newKey });
    } else {
      await ctx.db.insert("settings", { key: "INVITE_KEY", value: newKey });
    }

    return newKey;
  },
});

// Export data (placeholder)
export const exportData = mutation({
  args: {},
  handler: async (_ctx) => {
    return null;
  },
});
