"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { loginAction } from "@/app/actions/auth"
import { toast } from "sonner"

type Tab = "signin" | "join"

export default function AuthPage() {
  const userCount = useQuery(api.auth.getUserCount)
  const bootstrap = useMutation(api.auth.bootstrap)
  const register = useMutation(api.auth.register)
  const signIn = useMutation(api.auth.signIn)

  const [tab, setTab] = useState<Tab>("signin")
  const [loading, setLoading] = useState(false)

  // Setup form state
  const [setupName, setSetupName] = useState("")
  const [setupKey, setSetupKey] = useState("")

  // Sign in form state
  const [signInName, setSignInName] = useState("")

  // Join form state
  const [joinName, setJoinName] = useState("")
  const [inviteKey, setInviteKey] = useState("")

  const isLoading = userCount === undefined

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!setupName.trim() || !setupKey.trim()) return
    setLoading(true)
    try {
      const userId = await bootstrap({ name: setupName.trim(), setupKey: setupKey.trim() })
      await loginAction(userId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Setup failed")
      setLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signInName.trim()) return
    setLoading(true)
    try {
      const userId = await signIn({ name: signInName.trim() })
      await loginAction(userId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed")
      setLoading(false)
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinName.trim() || !inviteKey.trim()) return
    setLoading(true)
    try {
      const userId = await register({ name: joinName.trim(), inviteKey: inviteKey.trim() })
      await loginAction(userId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed")
      setLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  // First time setup
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
            <label className="text-sm font-medium" htmlFor="setup-key">
              Setup key
            </label>
            <input
              id="setup-key"
              type="password"
              value={setupKey}
              onChange={(e) => setSetupKey(e.target.value)}
              placeholder="Enter setup key from .env"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              required
            />
            <p className="text-xs text-muted-foreground">
              Set SETUP_KEY in your environment variables.
            </p>
          </div>
          <button
            type="submit"
            disabled={loading || !setupName.trim() || !setupKey.trim()}
            className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Setting up..." : "Create account"}
          </button>
        </form>
      </div>
    )
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
                Enter your name to sign in.
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="signin-name">
                Your name
              </label>
              <input
                id="signin-name"
                type="text"
                value={signInName}
                onChange={(e) => setSignInName(e.target.value)}
                placeholder="Enter your name"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading || !signInName.trim()}
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
              disabled={loading || !joinName.trim() || !inviteKey.trim()}
              className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Joining..." : "Join"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
