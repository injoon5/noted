"use client"

import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { use, useState, useCallback } from "react"
import { useDebounce } from "use-debounce"
import { Editor } from "@/components/editor/editor"
import { PageHeader } from "@/components/page/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, FileText } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface SpacePageProps {
  params: Promise<{ spaceId: string }>
}

export default function SpacePage({ params }: SpacePageProps) {
  const { spaceId } = use(params)
  const space = useQuery(api.spaces.get, {
    spaceId: spaceId as Id<"spaces">,
  })
  const pages = useQuery(api.pages.list, {
    spaceId: spaceId as Id<"spaces">,
  })
  const createPage = useMutation(api.pages.create)
  const updateSpace = useMutation(api.spaces.update)

  const [spaceTitle, setSpaceTitle] = useState("")
  const [debouncedTitle] = useDebounce(spaceTitle, 800)

  // Sync title from space
  useState(() => {
    if (space) setSpaceTitle(space.title)
  })

  const handleCreatePage = async () => {
    try {
      await createPage({
        spaceId: spaceId as Id<"spaces">,
        title: "Untitled",
      })
      toast.success("Page created")
    } catch {
      toast.error("Failed to create page")
    }
  }

  if (space === undefined) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    )
  }

  if (space === null) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Space not found.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-12">
      {/* Space header */}
      <div className="mb-8">
        {space.icon && (
          <div className="mb-3 text-5xl leading-none">{space.icon}</div>
        )}
        <h1 className="text-4xl font-bold tracking-tight">{space.title}</h1>
        <p className="mt-2 text-muted-foreground">
          {pages?.length ?? 0} page{(pages?.length ?? 0) !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Pages grid */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Pages
        </h2>
        <button
          onClick={handleCreatePage}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <Plus className="h-4 w-4" />
          New page
        </button>
      </div>

      {pages === undefined ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : pages.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border py-16 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-muted-foreground mb-4">No pages yet</p>
          <button
            onClick={handleCreatePage}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Create first page
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {pages.map((page) => (
            <Link
              key={page._id}
              href={`/${spaceId}/${page._id}`}
              className="flex items-center gap-3 rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors group"
            >
              {page.icon ? (
                <span className="text-2xl">{page.icon}</span>
              ) : (
                <FileText className="h-5 w-5 text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate group-hover:text-foreground">
                  {page.title || "Untitled"}
                </p>
                {page.content && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {page.content.replace(/<[^>]*>/g, "").slice(0, 120)}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
