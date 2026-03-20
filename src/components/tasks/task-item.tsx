"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Trash2, ChevronDown, ChevronRight, Calendar, Link2 } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface Task {
  _id: Id<"tasks">
  title: string
  description?: string
  status: "todo" | "in_progress" | "done"
  dueDate?: number
  linkedPageId?: Id<"pages">
  order: number
  createdAt: number
  updatedAt: number
}

interface TaskItemProps {
  task: Task
}

function formatTaskDate(ms: number): string {
  const date = new Date(ms)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  if (date.toDateString() === today.toDateString()) return "Today"
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow"
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function TaskItem({ task }: TaskItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showPagePicker, setShowPagePicker] = useState(false)
  const [pageSearchQuery, setPageSearchQuery] = useState("")

  const updateTask = useMutation(api.tasks.update)
  const removeTask = useMutation(api.tasks.remove)

  const pageResults = useQuery(
    api.pages.search,
    pageSearchQuery.length > 0 ? { query: pageSearchQuery } : "skip"
  )
  const linkedPage = useQuery(
    api.pages.get,
    task.linkedPageId ? { pageId: task.linkedPageId } : "skip"
  )

  const isCompleted = task.status === "done"
  const isOverdue =
    task.dueDate &&
    task.dueDate < Date.now() &&
    task.status !== "done"

  const handleToggle = async () => {
    try {
      await updateTask({
        taskId: task._id,
        status: isCompleted ? "todo" : "done",
      })
    } catch {
      toast.error("Failed to update task")
    }
  }

  const handleDelete = async () => {
    try {
      await removeTask({ taskId: task._id })
    } catch {
      toast.error("Failed to delete task")
    }
  }

  const handleTitleSave = async () => {
    if (!editTitle.trim()) return
    try {
      await updateTask({ taskId: task._id, title: editTitle.trim() })
      setIsEditing(false)
    } catch {
      toast.error("Failed to update task")
    }
  }

  const handleDateSelect = async (date: Date | undefined) => {
    try {
      await updateTask({
        taskId: task._id,
        dueDate: date ? date.getTime() : undefined,
      })
    } catch {
      toast.error("Failed to update due date")
    }
    setShowDatePicker(false)
  }

  const handleLinkPage = async (pageId: Id<"pages"> | null) => {
    try {
      await updateTask({
        taskId: task._id,
        linkedPageId: pageId ?? undefined,
      })
    } catch {
      toast.error("Failed to link page")
    }
    setShowPagePicker(false)
    setPageSearchQuery("")
  }

  return (
    <div
      className={cn(
        "group rounded-lg border bg-card transition-all",
        isCompleted && "opacity-60"
      )}
    >
      <div className="flex items-start gap-3 p-3">
        {/* Checkbox */}
        <button
          onClick={handleToggle}
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
            isCompleted
              ? "border-green-500 bg-green-500 text-white"
              : "border-muted-foreground/40 hover:border-primary"
          )}
        >
          {isCompleted && (
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <input
              autoFocus
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleSave()
                if (e.key === "Escape") {
                  setEditTitle(task.title)
                  setIsEditing(false)
                }
              }}
              className="w-full bg-transparent text-sm outline-none"
            />
          ) : (
            <button
              onDoubleClick={() => setIsEditing(true)}
              className={cn(
                "text-left text-sm",
                isCompleted && "line-through text-muted-foreground"
              )}
            >
              {task.title}
            </button>
          )}

          {/* Meta */}
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {/* Date picker */}
            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "flex items-center gap-1 text-xs rounded px-1.5 py-0.5 hover:bg-accent transition-colors",
                    isOverdue
                      ? "text-red-500"
                      : task.dueDate
                        ? "text-muted-foreground"
                        : "text-muted-foreground/60 hover:text-muted-foreground"
                  )}
                >
                  <Calendar className="h-3 w-3" />
                  {task.dueDate ? formatTaskDate(task.dueDate) : "Add date"}
                  {isOverdue && " · Overdue"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-auto" align="start">
                <DayPicker
                  mode="single"
                  selected={task.dueDate ? new Date(task.dueDate) : undefined}
                  onSelect={handleDateSelect}
                  className="p-3"
                />
                {task.dueDate && (
                  <div className="border-t p-2">
                    <button
                      onClick={() => handleDateSelect(undefined)}
                      className="w-full rounded px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent text-center"
                    >
                      Remove date
                    </button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {/* Linked page picker */}
            <Popover
              open={showPagePicker}
              onOpenChange={(open) => {
                setShowPagePicker(open)
                if (!open) setPageSearchQuery("")
              }}
            >
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "flex items-center gap-1 text-xs rounded px-1.5 py-0.5 hover:bg-accent transition-colors",
                    linkedPage
                      ? "text-muted-foreground"
                      : "text-muted-foreground/60 hover:text-muted-foreground"
                  )}
                >
                  <Link2 className="h-3 w-3" />
                  {linkedPage ? linkedPage.title || "Untitled" : "Link page"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="p-2 w-64" align="start">
                <input
                  autoFocus
                  value={pageSearchQuery}
                  onChange={(e) => setPageSearchQuery(e.target.value)}
                  placeholder="Search pages..."
                  className="w-full rounded border px-2 py-1.5 text-sm outline-none bg-background"
                />
                <div className="mt-2 max-h-48 overflow-y-auto space-y-0.5">
                  {pageResults?.map((page) => (
                    <button
                      key={page._id}
                      onClick={() => handleLinkPage(page._id)}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent text-left"
                    >
                      {page.icon && <span>{page.icon}</span>}
                      <span className="truncate">{page.title || "Untitled"}</span>
                    </button>
                  ))}
                  {!pageResults?.length && pageSearchQuery && (
                    <p className="text-xs text-muted-foreground p-2">No pages found</p>
                  )}
                  {!pageSearchQuery && (
                    <p className="text-xs text-muted-foreground p-2">Type to search pages</p>
                  )}
                </div>
                {task.linkedPageId && (
                  <div className="mt-2 border-t pt-2">
                    <button
                      onClick={() => handleLinkPage(null)}
                      className="w-full text-xs text-muted-foreground hover:text-foreground text-center py-1"
                    >
                      Remove link
                    </button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          {/* Description (expanded) */}
          {isExpanded && task.description && (
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {task.description && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent"
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
          )}
          <button
            onClick={handleDelete}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
