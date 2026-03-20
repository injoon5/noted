"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Plus } from "lucide-react"
import { TaskItem } from "./task-item"
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

interface TaskListProps {
  tasks: Task[]
  title: string
  showAddButton?: boolean
  emptyMessage?: string
}

export function TaskList({
  tasks,
  title,
  showAddButton = false,
  emptyMessage = "No tasks",
}: TaskListProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const createTask = useMutation(api.tasks.create)

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    try {
      await createTask({ title: newTaskTitle.trim() })
      setNewTaskTitle("")
      setIsAdding(false)
      toast.success("Task created")
    } catch {
      toast.error("Failed to create task")
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
          {tasks.length > 0 && (
            <span className="ml-2 text-xs font-normal normal-case">
              ({tasks.length})
            </span>
          )}
        </h3>
        {showAddButton && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add task
          </button>
        )}
      </div>

      <div className="space-y-2">
        {tasks.length === 0 && !isAdding && (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        )}

        {tasks.map((task) => (
          <TaskItem key={task._id} task={task} />
        ))}

        {/* Add task inline */}
        {isAdding && (
          <form onSubmit={handleAddTask} className="flex items-center gap-2">
            <div className="h-5 w-5 shrink-0 rounded-full border-2 border-muted-foreground/40" />
            <input
              autoFocus
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onBlur={() => {
                if (!newTaskTitle.trim()) setIsAdding(false)
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setIsAdding(false)
                  setNewTaskTitle("")
                }
              }}
              placeholder="Task title..."
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-1 ring-ring placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={!newTaskTitle.trim()}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false)
                setNewTaskTitle("")
              }}
              className="rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent"
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
