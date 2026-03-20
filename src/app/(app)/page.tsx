"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { FileText, Plus } from "lucide-react"
import { useMutation } from "convex/react"
import { toast } from "sonner"

export default function HomePage() {
  const router = useRouter()
  const spaces = useQuery(api.spaces.list)
  const users = useQuery(api.auth.listUsers)
  const createSpace = useMutation(api.spaces.create)
  const currentUser = users?.[0]

  // Redirect to first space automatically
  useEffect(() => {
    if (spaces && spaces.length > 0) {
      router.replace(`/${spaces[0]._id}`)
    }
  }, [spaces, router])

  const handleCreateSpace = async () => {
    if (!currentUser) return
    try {
      const spaceId = await createSpace({
        title: "My Space",
        ownerId: currentUser._id,
        icon: "📝",
      })
      router.push(`/${spaceId}`)
    } catch {
      toast.error("Failed to create space")
    }
  }

  // Loading state
  if (spaces === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="space-y-3 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    )
  }

  // Empty state - no spaces
  return (
    <div className="flex h-full flex-col items-center justify-center text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-6">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight mb-2">
        Welcome to Noted
      </h2>
      <p className="text-muted-foreground mb-8 max-w-sm">
        Your personal knowledge base. Create spaces to organize your notes,
        thoughts, and ideas.
      </p>
      <button
        onClick={handleCreateSpace}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Create your first space
      </button>
    </div>
  )
}
