import { createClient } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import type { GenericCtx } from "@convex-dev/better-auth/utils";
import type { BetterAuthOptions } from "better-auth";
import { betterAuth } from "better-auth";
import { components, internal } from "../_generated/api";
import type { DataModel } from "../_generated/dataModel";
import authConfig from "../auth.config";
import schema from "./schema";

// Better Auth Convex Component
export const authComponent = createClient<DataModel, typeof schema>(
  components.betterAuth,
  {
    local: { schema },
    verbose: false,
  }
);

// Better Auth Options
export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
  return {
    appName: "Noted",
    baseURL: process.env.SITE_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      autoSignIn: true,
    },
    user: {
      additionalFields: {
        role: {
          type: "string" as const,
          defaultValue: "member",
          required: false,
        },
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (userData: Record<string, unknown>) => {
            // Use runQuery to check user count in the Better Auth user table
            // This is available because createAuth is called from an action context (HTTP handler)
            const actionCtx = ctx as {
              runQuery: (ref: unknown, args: unknown) => Promise<unknown>;
            };
            const userCount = await actionCtx.runQuery(
              internal.auth.getBetterAuthUserCountInternal,
              {}
            );

            if (userCount === 0) {
              // First user ever → grant admin, no invite code required
              return { data: { ...userData, role: "admin" } };
            }

            // All subsequent users require a valid invite code
            const inviteCode =
              (userData as { inviteCode?: string }).inviteCode ?? "";

            const inviteKey = await actionCtx.runQuery(
              internal.auth.getInviteKeyInternal,
              {}
            );
            if (!inviteKey || inviteKey !== inviteCode) {
              throw new Error("Invalid invite code");
            }

            return { data: { ...userData, role: "member" } };
          },
        },
      },
    },
    plugins: [convex({ authConfig })],
  } satisfies BetterAuthOptions;
};

// For `npx auth generate` CLI
export const options = createAuthOptions({} as GenericCtx<DataModel>);

// Better Auth instance factory (called per-request with a Convex ctx)
export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth(createAuthOptions(ctx));
};
