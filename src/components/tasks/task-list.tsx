"use client"

import { useState, useRef } from "react"
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
  const inputRef = useRef<HTMLInputElement>(null)
  const createTask = useMutation(api.tasks.create)

  const handleAddTask = async (continueAdding = false) => {
    if (!newTaskTitle.trim()) {
      if (!continueAdding) setIsAdding(false)
      return
    }

    try {
      await createTask({ title: newTaskTitle.trim() })
      setNewTaskTitle("")
      if (continueAdding) {
        // Stay in adding mode; focus input for the next task
        setTimeout(() => inputRef.current?.focus(), 0)
      } else {
        setIsAdding(false)
        toast.success("Task created")
      }
    } catch {
      toast.error("Failed to create task")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTask(true)
    }
    if (e.key === "Escape") {
      setIsAdding(false)
      setNewTaskTitle("")
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
            onClick={() => {
              setIsAdding(true)
              setTimeout(() => inputRef.current?.focus(), 0)
            }}
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

        {/* Add task inline — shown at top of the list */}
        {isAdding && (
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
            <div className="h-5 w-5 shrink-0 rounded-full border-2 border-muted-foreground/40" />
            <input
              ref={inputRef}
              autoFocus
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onBlur={() => {
                // Small delay to allow button clicks to register
                setTimeout(() => {
                  if (!newTaskTitle.trim()) setIsAdding(false)
                }, 150)
              }}
              onKeyDown={handleKeyDown}
              placeholder="Task title… (Enter to add, Esc to cancel)"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleAddTask(false)}
                disabled={!newTaskTitle.trim()}
                className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Add
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setIsAdding(false)
                  setNewTaskTitle("")
                }}
                className="rounded-md px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {tasks.map((task) => (
          <TaskItem key={task._id} task={task} />
        ))}
      </div>
    </div>
  )
}
