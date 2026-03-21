"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useTheme } from "next-themes"
import { nanoid } from "nanoid"
import { Moon, Sun, Monitor, Users, Key, BarChart3, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const stats = useQuery(api.admin.getStats)
  const users = useQuery(api.auth.listUsers)
  const regenerateInviteKey = useMutation(api.admin.regenerateInviteKey)
  const [newInviteKey, setNewInviteKey] = useState("")

  const handleRegenerateKey = async () => {
    const key = nanoid(24)
    try {
      await regenerateInviteKey({ newKey: key })
      setNewInviteKey(key)
      toast.success("Invite key regenerated")
    } catch {
      toast.error("Failed to regenerate key")
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your Noted workspace.</p>
      </div>

      <div className="space-y-6">
        {/* Appearance */}
        <section className="rounded-xl border bg-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Appearance
          </h2>
          <div className="flex items-center gap-2">
            {(["light", "dark", "system"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm capitalize transition-colors",
                  theme === t
                    ? "border-primary bg-primary/5 text-primary font-medium"
                    : "hover:bg-accent text-muted-foreground"
                )}
              >
                {t === "light" && <Sun className="h-4 w-4" />}
                {t === "dark" && <Moon className="h-4 w-4" />}
                {t === "system" && <Monitor className="h-4 w-4" />}
                {t}
              </button>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="rounded-xl border bg-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </h2>
          {stats ? (
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Spaces", value: stats.spaces },
                { label: "Pages", value: stats.pages },
                { label: "Tasks", value: stats.tasks },
                { label: "Files", value: stats.files },
                { label: "Users", value: stats.users },
                { label: "Public pages", value: stats.publicPages },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="rounded-lg bg-muted/50 p-3 text-center"
                >
                  <div className="text-2xl font-bold">{value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {["sk-a","sk-b","sk-c","sk-d","sk-e","sk-f"].map((k) => (
                <div key={k} className="h-16 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          )}
        </section>

        {/* Users */}
        <section className="rounded-xl border bg-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </h2>
          <div className="space-y-2">
            {users?.map((user) => (
              <div
                key={user._id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  {user.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {user.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Invite key */}
        <section className="rounded-xl border bg-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
            <Key className="h-4 w-4" />
            Invite key
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Share this key with people you want to invite to your workspace.
          </p>
          {newInviteKey && (
            <div className="mb-4 rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground mb-1">New invite key (copy now):</p>
              <code className="text-sm font-mono font-medium">{newInviteKey}</code>
            </div>
          )}
          <button
            onClick={handleRegenerateKey}
            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-accent transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Regenerate invite key
          </button>
        </section>
      </div>
    </div>
  )
}
