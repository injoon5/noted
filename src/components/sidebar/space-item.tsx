"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import {
  ChevronRight,
  MoreHorizontal,
  Plus,
  Star,
  Trash2,
  Edit2,
  GripVertical,
} from "lucide-react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

interface SpaceItemProps {
  id: Id<"spaces"> | Id<"pages">
  type: "space" | "page"
  title: string
  icon?: string
  href: string
  depth?: number
  isFavorite?: boolean
  spaceId?: Id<"spaces">
  children?: React.ReactNode
  defaultExpanded?: boolean
}

export function SpaceItem({
  id,
  type,
  title,
  icon,
  href,
  depth = 0,
  isFavorite,
  spaceId,
  children,
  defaultExpanded = false,
}: SpaceItemProps) {
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [isRenaming, setIsRenaming] = useState(false)
  const [newTitle, setNewTitle] = useState("")

  const createPage = useMutation(api.pages.create)
  const updatePage = useMutation(api.pages.update)
  const removePage = useMutation(api.pages.remove)
  const removeSpace = useMutation(api.spaces.remove)
  const updateSpace = useMutation(api.spaces.update)

  const isDraggable = type === "space" || type === "page"

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isDraggable })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const isActive = pathname === href
  const hasChildren = !!children

  const handleAddPage = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const targetSpaceId = type === "space" ? (id as Id<"spaces">) : spaceId!
      const parentId = type === "page" ? (id as Id<"pages">) : undefined
      await createPage({
        spaceId: targetSpaceId,
        parentId,
        title: "Untitled",
      })
      setIsExpanded(true)
    } catch {
      toast.error("Failed to create page")
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    try {
      if (type === "space") {
        await removeSpace({ spaceId: id as Id<"spaces"> })
        toast.success("Space deleted")
      } else {
        await removePage({ pageId: id as Id<"pages"> })
        toast.success("Page deleted")
      }
    } catch {
      toast.error("Failed to delete")
    }
  }

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (type !== "page") return
    try {
      await updatePage({
        pageId: id as Id<"pages">,
        isFavorite: !isFavorite,
      })
    } catch {
      toast.error("Failed to update")
    }
  }

  const handleRename = async () => {
    if (!newTitle.trim()) return
    try {
      if (type === "space") {
        await updateSpace({ spaceId: id as Id<"spaces">, title: newTitle.trim() })
      } else {
        await updatePage({ pageId: id as Id<"pages">, title: newTitle.trim() })
      }
      setIsRenaming(false)
    } catch {
      toast.error("Failed to rename")
    }
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-md pr-1 transition-colors border-l-2",
          isActive
            ? "border-[hsl(var(--accent-orange))] bg-sidebar-accent/80 text-sidebar-accent-foreground"
            : "border-transparent hover:bg-sidebar-accent/50"
        )}
        style={{ paddingLeft: `${depth * 12 + (isActive ? 2 : 4)}px` }}
      >
        {/* Drag handle (spaces and pages) */}
        {isDraggable && (
          <button
            {...attributes}
            {...listeners}
            className="drag-handle mr-0.5 flex h-5 w-4 cursor-grab items-center justify-center rounded text-muted-foreground opacity-0 group-hover:opacity-100 active:cursor-grabbing"
            tabIndex={-1}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Expand chevron */}
        <button
          onClick={(e) => {
            e.preventDefault()
            setIsExpanded(!isExpanded)
          }}
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-transform hover:bg-accent",
            !hasChildren && "opacity-0 pointer-events-none"
          )}
        >
          <ChevronRight
            className={cn(
              "h-3 w-3 transition-transform",
              isExpanded && "rotate-90"
            )}
          />
        </button>

        {/* Link */}
        <Link
          href={href}
          className="flex min-w-0 flex-1 items-center gap-1.5 py-1.5 text-sm"
        >
          {isRenaming ? null : (
            <>
              {icon ? (
                <span className="shrink-0 text-base leading-none">{icon}</span>
              ) : (
                <span className="h-4 w-4 shrink-0 rounded bg-muted" />
              )}
              <span className="truncate text-sidebar-foreground">{title || "Untitled"}</span>
            </>
          )}
        </Link>

        {/* Hover actions */}
        <div className="flex shrink-0 items-center gap-0.5 opacity-20 transition-opacity group-hover:opacity-100">
          <button
            onClick={handleAddPage}
            className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
            title="Add page"
          >
            <Plus className="h-3 w-3" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault()
                  setNewTitle(title)
                  setIsRenaming(true)
                }}
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              {type === "page" && (
                <DropdownMenuItem onClick={handleToggleFavorite}>
                  <Star
                    className={cn(
                      "mr-2 h-4 w-4",
                      isFavorite && "fill-yellow-400 text-yellow-400"
                    )}
                  />
                  {isFavorite ? "Remove from favorites" : "Add to favorites"}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleAddPage}>
                <Plus className="mr-2 h-4 w-4" />
                Add page
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Rename input */}
      {isRenaming && (
        <div className="px-2 py-1">
          <input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename()
              if (e.key === "Escape") setIsRenaming(false)
            }}
            className="w-full rounded border border-ring bg-background px-2 py-0.5 text-sm outline-none ring-1 ring-ring"
          />
        </div>
      )}

      {/* Children */}
      {isExpanded && children && (
        <div>{children}</div>
      )}
    </div>
  )
}
