"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Doc } from "@/convex/_generated/dataModel"
import { Command } from "cmdk"
import {
  Search,
  FileText,
  CheckSquare,
  Plus,
  Settings,
  Moon,
  Sun,
  Hash,
} from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface CmdPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export function CmdPalette({ isOpen, onClose }: CmdPaletteProps) {
  const [search, setSearch] = useState("")
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const searchResults = useQuery(
    api.pages.search,
    search.length > 1 ? { query: search } : "skip"
  )
  const spaces = useQuery(api.spaces.list)
  const createPage = useMutation(api.pages.create)
  const createTask = useMutation(api.tasks.create)

  useEffect(() => {
    if (!isOpen) {
      setSearch("")
    }
  }, [isOpen])

  const handleSelect = useCallback(
    (value: string) => {
      onClose()
      if (value.startsWith("page:")) {
        const pageId = value.replace("page:", "")
        // Find the page to get spaceId
        const page = (searchResults as Doc<"pages">[] | undefined)?.find((p) => p._id === pageId)
        if (page) {
          router.push(`/${page.spaceId}/${page._id}`)
        }
      } else if (value === "tasks") {
        router.push("/tasks")
      } else if (value === "settings") {
        router.push("/settings")
      } else if (value === "toggle-theme") {
        setTheme(theme === "dark" ? "light" : "dark")
      } else if (value === "new-page") {
        const firstSpace = spaces?.[0]
        if (!firstSpace) {
          toast.error("Create a space first")
          return
        }
        createPage({
          spaceId: firstSpace._id,
          title: "Untitled",
        }).then((pageId) => {
          router.push(`/${firstSpace._id}/${pageId}`)
        }).catch(() => {
          toast.error("Failed to create page")
        })
      } else if (value === "new-task") {
        createTask({ title: "New task" }).then(() => {
          router.push("/tasks")
          toast.success("Task created")
        }).catch(() => {
          toast.error("Failed to create task")
        })
      } else if (value.startsWith("space:")) {
        const spaceId = value.replace("space:", "")
        router.push(`/${spaceId}`)
      }
    },
    [onClose, router, searchResults, theme, setTheme, spaces, createPage, createTask]
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Command palette */}
      <div className="relative w-full max-w-xl rounded-xl border bg-popover shadow-2xl overflow-hidden">
        <Command className="flex flex-col" shouldFilter={false}>
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Search pages, commands..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
            <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground sm:block">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[360px] overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            {/* Search results */}
            {search.length > 1 && searchResults && searchResults.length > 0 && (
              <Command.Group heading="Pages">
                {(searchResults as Doc<"pages">[]).map((page) => (
                  <Command.Item
                    key={page._id}
                    value={`page:${page._id}`}
                    onSelect={handleSelect}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm",
                      "aria-selected:bg-accent aria-selected:text-accent-foreground",
                      "hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium">
                        {page.icon} {page.title || "Untitled"}
                      </div>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Spaces */}
            {!search && spaces && spaces.length > 0 && (
              <Command.Group heading="Spaces">
                {(spaces as Doc<"spaces">[]).map((space) => (
                  <Command.Item
                    key={space._id}
                    value={`space:${space._id}`}
                    onSelect={handleSelect}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm",
                      "aria-selected:bg-accent aria-selected:text-accent-foreground",
                      "hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Hash className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>{space.icon} {space.title}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Commands */}
            <Command.Group heading="Actions">
              <Command.Item
                value="new-page"
                onSelect={handleSelect}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm",
                  "aria-selected:bg-accent aria-selected:text-accent-foreground",
                  "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>New page</span>
              </Command.Item>
              <Command.Item
                value="new-task"
                onSelect={handleSelect}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm",
                  "aria-selected:bg-accent aria-selected:text-accent-foreground",
                  "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <CheckSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>New task</span>
              </Command.Item>
              <Command.Item
                value="tasks"
                onSelect={handleSelect}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm",
                  "aria-selected:bg-accent aria-selected:text-accent-foreground",
                  "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <CheckSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>Go to Tasks</span>
              </Command.Item>
              <Command.Item
                value="settings"
                onSelect={handleSelect}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm",
                  "aria-selected:bg-accent aria-selected:text-accent-foreground",
                  "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Settings className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>Settings</span>
              </Command.Item>
              <Command.Item
                value="toggle-theme"
                onSelect={handleSelect}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm",
                  "aria-selected:bg-accent aria-selected:text-accent-foreground",
                  "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <Moon className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span>Toggle {theme === "dark" ? "light" : "dark"} mode</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  )
}
