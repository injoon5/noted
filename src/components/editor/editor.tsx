"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react"
import { useDebounce } from "use-debounce"
import { getExtensions } from "./extensions"
import { SlashCommandMenu } from "./slash-command"
import { EditorToolbar } from "./toolbar"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface EditorProps {
  content: string
  onChange?: (content: string) => void
  placeholder?: string
  editable?: boolean
  className?: string
}

type SaveStatus = "saved" | "saving" | "unsaved"

export function Editor({
  content,
  onChange,
  placeholder,
  editable = true,
  className,
}: EditorProps) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved")
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [slashQuery, setSlashQuery] = useState("")
  const [slashPosition, setSlashPosition] = useState({ top: 0, left: 0 })
  const isInitialMount = useRef(true)

  const editor = useEditor({
    extensions: getExtensions(placeholder),
    content,
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap prose prose-sm max-w-none focus:outline-none min-h-[200px] px-0",
      },
    },
    onUpdate: ({ editor }) => {
      if (isInitialMount.current) return
      setSaveStatus("unsaved")
      onChange?.(editor.getHTML())
    },
  })

  // Sync content from outside when it changes (e.g. page switches)
  useEffect(() => {
    if (!editor) return
    const currentContent = editor.getHTML()
    if (content !== currentContent) {
      isInitialMount.current = true
      editor.commands.setContent(content, false)
      // Allow updates after the next tick
      setTimeout(() => {
        isInitialMount.current = false
      }, 100)
    }
  }, [content, editor])

  // Mark as saved after a delay (actual save is handled by parent)
  const [debouncedSaveStatus] = useDebounce(saveStatus, 1500)
  useEffect(() => {
    if (debouncedSaveStatus === "unsaved") {
      setSaveStatus("saved")
    }
  }, [debouncedSaveStatus])

  // Initial mount - don't trigger onChange
  useEffect(() => {
    const timer = setTimeout(() => {
      isInitialMount.current = false
    }, 200)
    return () => clearTimeout(timer)
  }, [])

  // Handle slash command
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!editor) return

      if (e.key === "/") {
        // Get cursor position for menu placement
        const { view } = editor
        const { from } = view.state.selection
        const coords = view.coordsAtPos(from)
        setSlashPosition({
          top: coords.bottom + window.scrollY + 8,
          left: coords.left + window.scrollX,
        })
        setSlashQuery("")
        setShowSlashMenu(true)
      } else if (showSlashMenu) {
        if (e.key === "Backspace" && slashQuery === "") {
          setShowSlashMenu(false)
        } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
          setSlashQuery((q) => q + e.key)
        } else if (e.key === "Backspace") {
          setSlashQuery((q) => q.slice(0, -1))
        }
      }
    },
    [editor, showSlashMenu, slashQuery]
  )

  if (!editor) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    )
  }

  return (
    <div className={cn("relative", className)}>
      {/* Bubble Menu */}
      {editable && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 100 }}
          shouldShow={({ from, to }) => from !== to}
        >
          <EditorToolbar editor={editor} />
        </BubbleMenu>
      )}

      {/* Editor content */}
      <div onKeyDown={handleKeyDown}>
        <EditorContent editor={editor} />
      </div>

      {/* Slash command menu */}
      {showSlashMenu && editable && (
        <SlashCommandMenu
          editor={editor}
          query={slashQuery}
          onClose={() => setShowSlashMenu(false)}
          position={slashPosition}
        />
      )}

      {/* Save status */}
      {editable && (
        <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          {saveStatus === "saving" && (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />
              Saving…
            </>
          )}
          {saveStatus === "saved" && (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
              Saved
            </>
          )}
          {saveStatus === "unsaved" && (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
              Unsaved changes
            </>
          )}
        </div>
      )}
    </div>
  )
}
