import { mutation, query } from "./_generated/server";

// Get overall stats
export const getStats = query({
  args: {},
  handler: async (ctx) => {
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

// Get recent activity
export const getRecentActivity = query({
  args: {},
  handler: async (ctx) => {
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

// Regenerate invite key — generates key internally, no args needed
export const regenerateInviteKey = mutation({
  args: {},
  handler: async (ctx) => {
    // Generate a 21-char hex token using crypto
    const bytes = new Uint8Array(16);
    // Convex mutations run in a JS environment with crypto available
    const randomValues = Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 256)
    );
    for (let i = 0; i < 16; i++) bytes[i] = randomValues[i];

    const newKey = randomValues
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
    // Placeholder — would generate ZIP with all pages as .md files
    return null;
  },
});
