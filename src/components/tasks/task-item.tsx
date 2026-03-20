"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Trash2, ChevronDown, ChevronRight, Calendar, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"

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

export function TaskItem({ task }: TaskItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)

  const updateTask = useMutation(api.tasks.update)
  const removeTask = useMutation(api.tasks.remove)

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
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            {task.dueDate && (
              <span
                className={cn(
                  "flex items-center gap-1",
                  isOverdue && "text-red-500"
                )}
              >
                <Calendar className="h-3 w-3" />
                {formatDate(task.dueDate)}
                {isOverdue && " · Overdue"}
              </span>
            )}
            {task.linkedPageId && (
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Linked page
              </span>
            )}
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
