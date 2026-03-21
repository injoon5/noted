"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Tab = "signin" | "join";

export default function AuthPage() {
  const userCount = useQuery(api.auth.getUserCount);
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("signin");
  const [loading, setLoading] = useState(false);

  // Admin setup form state (first user)
  const [setupName, setSetupName] = useState("");
  const [setupEmail, setSetupEmail] = useState("");
  const [setupPassword, setSetupPassword] = useState("");

  // Sign in form state
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Join form state
  const [joinName, setJoinName] = useState("");
  const [joinEmail, setJoinEmail] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [inviteKey, setInviteKey] = useState("");

  const isLoading = userCount === undefined;

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupName.trim() || !setupEmail.trim() || !setupPassword.trim())
      return;
    setLoading(true);
    try {
      const result = await authClient.signUp.email({
        name: setupName.trim(),
        email: setupEmail.trim(),
        password: setupPassword,
      });
      if (result.error) {
        toast.error(result.error?.message ?? "Setup failed");
        setLoading(false);
        return;
      }
      router.push("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Setup failed");
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail.trim() || !signInPassword.trim()) return;
    setLoading(true);
    try {
      const result = await authClient.signIn.email({
        email: signInEmail.trim(),
        password: signInPassword,
      });
      if (result.error) {
        toast.error(result.error?.message ?? "Sign in failed");
        setLoading(false);
        return;
      }
      router.push("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !joinName.trim() ||
      !joinEmail.trim() ||
      !joinPassword.trim() ||
      !inviteKey.trim()
    )
      return;
    setLoading(true);
    try {
      // Pass inviteCode as additional data - checked server-side in databaseHooks
      const result = await authClient.signUp.email({
        name: joinName.trim(),
        email: joinEmail.trim(),
        password: joinPassword,
        // @ts-expect-error - inviteCode is a custom field checked server-side
        inviteCode: inviteKey.trim(),
      });
      if (result.error) {
        toast.error(result.error?.message ?? "Registration failed");
        setLoading(false);
        return;
      }
      router.push("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // First time setup - create admin account
  if (userCount === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Set up Noted</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Create your admin account to get started.
          </p>
        </div>
        <form onSubmit={handleSetup} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="setup-name">
              Your name
            </label>
            <input
              id="setup-name"
              type="text"
              value={setupName}
              onChange={(e) => setSetupName(e.target.value)}
              placeholder="Enter your name"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              required
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="setup-email">
              Email
            </label>
            <input
              id="setup-email"
              type="email"
              value={setupEmail}
              onChange={(e) => setSetupEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="setup-password">
              Password
            </label>
            <input
              id="setup-password"
              type="password"
              value={setupPassword}
              onChange={(e) => setSetupPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              required
              minLength={8}
            />
          </div>
          <button
            type="submit"
            disabled={
              loading ||
              !setupName.trim() ||
              !setupEmail.trim() ||
              !setupPassword.trim()
            }
            className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Setting up..." : "Create admin account"}
          </button>
        </form>
      </div>
    );
  }

  // Existing users - show sign in / join tabs
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setTab("signin")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            tab === "signin"
              ? "bg-background text-foreground border-b-2 border-primary -mb-px"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Sign in
        </button>
        <button
          onClick={() => setTab("join")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            tab === "join"
              ? "bg-background text-foreground border-b-2 border-primary -mb-px"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Join
        </button>
      </div>

      <div className="p-8">
        {tab === "signin" ? (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Welcome back</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Sign in with your email and password.
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="signin-email">
                Email
              </label>
              <input
                id="signin-email"
                type="email"
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="signin-password">
                Password
              </label>
              <input
                id="signin-password"
                type="password"
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              />
            </div>
            <button
              type="submit"
              disabled={
                loading || !signInEmail.trim() || !signInPassword.trim()
              }
              className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Join Noted</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Use your invite key to create an account.
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="join-name">
                Your name
              </label>
              <input
                id="join-name"
                type="text"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                placeholder="Enter your name"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="join-email">
                Email
              </label>
              <input
                id="join-email"
                type="email"
                value={joinEmail}
                onChange={(e) => setJoinEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="join-password">
                Password
              </label>
              <input
                id="join-password"
                type="password"
                value={joinPassword}
                onChange={(e) => setJoinPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
                minLength={8}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="invite-key">
                Invite key
              </label>
              <input
                id="invite-key"
                type="password"
                value={inviteKey}
                onChange={(e) => setInviteKey(e.target.value)}
                placeholder="Enter invite key"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              />
            </div>
            <button
              type="submit"
              disabled={
                loading ||
                !joinName.trim() ||
                !joinEmail.trim() ||
                !joinPassword.trim() ||
                !inviteKey.trim()
              }
              className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Joining..." : "Join"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
