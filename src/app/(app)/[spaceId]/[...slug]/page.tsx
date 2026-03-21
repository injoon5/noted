"use client"

import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { use, useState, useEffect, useRef, useCallback } from "react"
import { useDebounce } from "use-debounce"
import { Editor } from "@/components/editor/editor"
import { PageHeader } from "@/components/page/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

interface PageViewProps {
  params: Promise<{ spaceId: string; slug: string[] }>
}

export default function PageView({ params }: PageViewProps) {
  const { spaceId, slug } = use(params)
  const pageId = slug[slug.length - 1] as Id<"pages">

  const page = useQuery(api.pages.get, { pageId })
  const space = useQuery(api.spaces.get, {
    spaceId: spaceId as Id<"spaces">,
  })
  const updatePage = useMutation(api.pages.update)

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [wordCount, setWordCount] = useState(0)
  const isSyncingRef = useRef(false)
  const [debouncedContent] = useDebounce(content, 800)
  const [debouncedTitle] = useDebounce(title, 800)
  const hasLoadedRef = useRef(false)

  // Load page data when the page first arrives or page ID changes
  useEffect(() => {
    if (page && !hasLoadedRef.current) {
      setTitle(page.title)
      setContent(page.content)
      hasLoadedRef.current = true
    }
  }, [page?._id])

  // Reset the loaded flag when navigating to a different page
  useEffect(() => {
    hasLoadedRef.current = false
  }, [pageId])

  // Auto-save debounced content
  useEffect(() => {
    if (!page || isSyncingRef.current) return
    if (debouncedContent === page.content) return

    updatePage({
      pageId,
      content: debouncedContent,
    }).catch(console.error)
  }, [debouncedContent])

  // Auto-save debounced title
  useEffect(() => {
    if (!page || isSyncingRef.current) return
    if (!debouncedTitle || debouncedTitle === page.title) return

    updatePage({
      pageId,
      title: debouncedTitle,
    }).catch(console.error)
  }, [debouncedTitle])

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    // Count words from plain text
    const text = newContent.replace(/<[^>]*>/g, " ").trim()
    const words = text ? text.split(/\s+/).length : 0
    setWordCount(words)
  }

  const handleUpdate = useCallback(
    async (updates: { title?: string; icon?: string | null; coverImage?: string | null; isPublic?: boolean }) => {
      if (updates.title !== undefined) setTitle(updates.title)
      await updatePage({ pageId, ...updates })
    },
    [pageId, updatePage]
  )

  if (page === undefined) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="h-48 animate-pulse bg-muted" />
        <div className="p-8 space-y-4">
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    )
  }

  if (page === null) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Page not found.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl pb-24">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 px-8 pt-6 pb-2 text-xs text-muted-foreground">
        {space && (
          <>
            <Link
              href={`/${spaceId}`}
              className="hover:text-foreground transition-colors"
            >
              {space.icon} {space.title}
            </Link>
            <ChevronRight className="h-3 w-3" />
          </>
        )}
        <span className="text-foreground">{page.title || "Untitled"}</span>
      </div>

      {/* Page header */}
      <PageHeader
        page={{ _id: pageId, title, icon: page.icon, coverImage: page.coverImage, updatedAt: page.updatedAt, spaceId, isPublic: page.isPublic }}
        wordCount={wordCount}
        onUpdate={handleUpdate}
        editable
      />

      {/* Editor */}
      <div className="px-8 mt-2">
        <Editor
          content={content}
          onChange={handleContentChange}
          placeholder="Start writing, or press '/' for commands…"
          editable
        />
      </div>
    </div>
  )
}
