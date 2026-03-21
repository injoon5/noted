"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react"
import { useDebounce } from "use-debounce"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
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

interface PageResult {
  _id: string
  title: string
  icon?: string | null
}

interface PageSearchMenuProps {
  editor: ReturnType<typeof useEditor>
  query: string
  position: { top: number; left: number }
  triggerPos: number | null
  onClose: () => void
}

function PageSearchMenu({
  editor,
  query,
  position,
  triggerPos,
  onClose,
}: PageSearchMenuProps) {
  const pages = useQuery(
    api.pages.search,
    query.length >= 0 ? { query: query || " " } : "skip"
  ) as PageResult[] | undefined

  const menuRef = useRef<HTMLDivElement>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [prevQuery, setPrevQuery] = useState(query)

  // Reset selection index when query changes (during render, no useEffect needed)
  if (prevQuery !== query) {
    setPrevQuery(query)
    setSelectedIndex(0)
  }

  const insertPageLink = useCallback(
    (page: PageResult) => {
      if (!editor || triggerPos === null) return
      const { from } = editor.state.selection
      editor
        .chain()
        .focus()
        .deleteRange({ from: triggerPos, to: from })
        .insertContent({
          type: "pageLink",
          attrs: {
            pageId: page._id,
            title: page.title,
            icon: page.icon ?? null,
          },
        })
        .run()
      onClose()
    },
    [editor, triggerPos, onClose]
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const results = pages ?? []
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((i) => (i < results.length - 1 ? i + 1 : 0))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((i) => (i > 0 ? i - 1 : results.length - 1))
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (results[selectedIndex]) {
          insertPageLink(results[selectedIndex])
        }
      } else if (e.key === "Escape") {
        onClose()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [pages, selectedIndex, insertPageLink, onClose])

  // Click-outside to close
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [onClose])

  const results = pages ?? []

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[220px] max-w-xs rounded-lg border bg-popover shadow-md"
      style={{ top: position.top, left: position.left }}
    >
      <div className="p-1">
        {results.length === 0 ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">
            {query ? "No pages found" : "Type to search pages…"}
          </div>
        ) : (
          results.map((page, index) => (
            <button
              key={page._id}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm transition-colors",
                index === selectedIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              )}
              onClick={() => insertPageLink(page)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {page.icon && (
                <span className="text-base leading-none">{page.icon}</span>
              )}
              <span className="truncate font-medium">
                {page.title || "Untitled"}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

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

  const [showPageSearch, setShowPageSearch] = useState(false)
  const [pageQuery, setPageQuery] = useState("")
  const [pageSearchPos, setPageSearchPos] = useState({ top: 0, left: 0 })
  const [pageLinkTriggerPos, setPageLinkTriggerPos] = useState<number | null>(null)

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

  // Handle slash command and [[ page search
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!editor) return

      // Handle page search query update
      if (showPageSearch) {
        if (e.key === "Escape") {
          setShowPageSearch(false)
          return
        }
        if (e.key === "Backspace") {
          if (pageQuery === "") {
            setShowPageSearch(false)
          } else {
            setPageQuery((q) => q.slice(0, -1))
          }
          return
        }
        if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
          setPageQuery((q) => q + e.key)
          return
        }
        return
      }

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
      } else if (e.key === "[") {
        // Detect [[ trigger
        const { view } = editor
        const { from } = view.state.selection
        const textBefore = view.state.doc.textBetween(Math.max(0, from - 1), from)
        if (textBefore === "[") {
          const coords = view.coordsAtPos(from)
          setPageSearchPos({
            top: coords.bottom + window.scrollY + 8,
            left: coords.left + window.scrollX,
          })
          setPageQuery("")
          // triggerPos is position of the first "[", which is from - 1
          setPageLinkTriggerPos(() => from - 1)
          setShowPageSearch(true)
        }
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
    [editor, showSlashMenu, slashQuery, showPageSearch, pageQuery]
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

      {/* Page search menu */}
      {showPageSearch && editable && (
        <PageSearchMenu
          editor={editor}
          query={pageQuery}
          position={pageSearchPos}
          triggerPos={pageLinkTriggerPos}
          onClose={() => setShowPageSearch(false)}
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
