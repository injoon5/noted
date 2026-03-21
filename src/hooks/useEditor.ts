"use client"

import { useCallback, useRef, useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

type SaveStatus = "saved" | "saving" | "unsaved"

interface UseEditorOptions {
  pageId: Id<"pages">
  initialContent: string
  initialTitle: string
  debounceMs?: number
}

export function usePageEditor({
  pageId,
  initialContent,
  initialTitle,
  debounceMs = 1000,
}: UseEditorOptions) {
  const [content, setContent] = useState(initialContent)
  const [title, setTitle] = useState(initialTitle)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved")
  const updatePage = useMutation(api.pages.update)
  const pendingUpdate = useRef<NodeJS.Timeout | null>(null)

  const save = useCallback(
    async (newContent?: string, newTitle?: string) => {
      setSaveStatus("saving")
      try {
        await updatePage({
          pageId,
          content: newContent ?? content,
          title: newTitle ?? title,
        })
        setSaveStatus("saved")
      } catch {
        setSaveStatus("unsaved")
      }
    },
    [pageId, content, title, updatePage]
  )

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent)
    setSaveStatus("unsaved")
    if (pendingUpdate.current) clearTimeout(pendingUpdate.current)
    pendingUpdate.current = setTimeout(() => {
      save(newContent, undefined)
    }, debounceMs)
  }, [save, debounceMs])

  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle)
    setSaveStatus("unsaved")
    if (pendingUpdate.current) clearTimeout(pendingUpdate.current)
    pendingUpdate.current = setTimeout(() => {
      save(undefined, newTitle)
    }, debounceMs)
  }, [save, debounceMs])

  return {
    content,
    title,
    saveStatus,
    handleContentChange,
    handleTitleChange,
    save,
  }
}
