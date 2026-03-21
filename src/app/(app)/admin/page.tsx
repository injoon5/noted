"use client"

import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { LayoutGrid, FileText, CheckSquare, HardDrive, Globe, Users, Activity, AlertTriangle, RefreshCw, Download, ShieldOff } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"

export default function AdminPage() {
  const currentUser = useQuery(api.auth.getCurrentUser)
  const stats = useQuery(api.admin.getStats)
  const recentActivity = useQuery(api.admin.getRecentActivity)
  const regenerateKey = useMutation(api.admin.regenerateInviteKey)

  // Loading
  if (currentUser === undefined) {
    return <div className="flex h-full items-center justify-center"><div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
  }

  // Access control — only admins may view this page
  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
        <ShieldOff className="h-10 w-10" />
        <p className="text-sm">You don&apos;t have permission to view this page.</p>
      </div>
    )
  }

  const handleRegenerate = async () => {
    if (!confirm("Regenerate invite key? The old key will stop working immediately.")) return
    try {
      const newKey = await regenerateKey({})
      toast.success(`New invite key: ${newKey}`, { duration: 10000 })
    } catch {
      toast.error("Failed to regenerate invite key")
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <h1 className="text-2xl font-bold mb-8">Admin</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
        {[
          { label: "Spaces", value: stats?.spaceCount ?? "—", icon: LayoutGrid },
          { label: "Pages", value: stats?.pageCount ?? "—", icon: FileText },
          { label: "Tasks", value: stats?.taskCount ?? "—", icon: CheckSquare },
          { label: "Files", value: stats?.fileSize != null ? formatBytes(stats.fileSize) : "0 B", icon: HardDrive },
          { label: "Public Pages", value: stats?.publicPageCount ?? "—", icon: Globe },
          { label: "Users", value: stats?.userCount ?? "—", icon: Users },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Icon className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
            </div>
            <p className="text-2xl font-bold">{value}</p>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="mb-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Recent Activity
        </h2>
        <div className="space-y-2">
          {(recentActivity as Array<{ icon: string; description: string; timestamp: number }> | null | undefined)?.map((item, i) => (
            <div key={`${item.timestamp}-${i}`} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">{item.icon}</span>
                <span className="text-sm">{item.description}</span>
              </div>
              <span className="text-xs text-muted-foreground">{formatRelativeTime(item.timestamp)}</span>
            </div>
          ))}
          {!recentActivity?.length && (
            <p className="text-sm text-muted-foreground">No recent activity.</p>
          )}
        </div>
      </div>

      <Separator className="mb-10" />

      {/* Danger Zone */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-red-500 mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Danger Zone
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Regenerate Invite Key</p>
              <p className="text-xs text-muted-foreground mt-0.5">The current invite code will immediately stop working.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              className="shrink-0 border-red-200 hover:bg-red-100 dark:border-red-800"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-2" />
              Regenerate
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Export All Data</p>
              <p className="text-xs text-muted-foreground mt-0.5">Download all pages as markdown files in a ZIP archive.</p>
            </div>
            <Button variant="outline" size="sm" disabled title="Coming soon">
              <Download className="h-3.5 w-3.5 mr-2" />
              Export ZIP
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
