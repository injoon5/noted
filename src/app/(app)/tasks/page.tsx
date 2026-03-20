"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { TaskList } from "@/components/tasks/task-list"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckSquare, Plus } from "lucide-react"
import { toast } from "sonner"

export default function TasksPage() {
  const todayTasks = useQuery(api.tasks.getTodayTasks)
  const upcomingTasks = useQuery(api.tasks.getUpcoming)
  const allTasks = useQuery(api.tasks.list)
  const createTask = useMutation(api.tasks.create)

  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState("")

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    try {
      await createTask({ title: newTitle.trim() })
      setNewTitle("")
      setIsCreating(false)
      toast.success("Task created")
    } catch {
      toast.error("Failed to create task")
    }
  }

  const isLoading = todayTasks === undefined || upcomingTasks === undefined

  // Get tasks without due date
  const noDueDateTasks = allTasks?.filter((t) => !t.dueDate && t.status !== "done") ?? []
  const completedTasks = allTasks?.filter((t) => t.status === "done") ?? []

  return (
    <div className="mx-auto max-w-2xl px-8 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CheckSquare className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Tasks</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Stay on top of your work and goals.
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New task
        </button>
      </div>

      {/* Quick add form */}
      {isCreating && (
        <form onSubmit={handleCreate} className="mb-6 rounded-xl border bg-card p-4 space-y-3">
          <input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Task title..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={!newTitle.trim()}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Create task
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false)
                setNewTitle("")
              }}
              className="rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Today */}
          <TaskList
            tasks={todayTasks}
            title="Today"
            showAddButton
            emptyMessage="Nothing due today. Enjoy your day!"
          />

          {/* Upcoming */}
          {upcomingTasks.length > 0 && (
            <TaskList
              tasks={upcomingTasks}
              title="Upcoming"
              emptyMessage="No upcoming tasks"
            />
          )}

          {/* No due date */}
          {noDueDateTasks.length > 0 && (
            <TaskList
              tasks={noDueDateTasks}
              title="No due date"
              showAddButton
              emptyMessage="No tasks without due dates"
            />
          )}

          {/* Completed */}
          {completedTasks.length > 0 && (
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                <span className="group-open:hidden">▶</span>
                <span className="hidden group-open:inline">▼</span>
                Completed ({completedTasks.length})
              </summary>
              <div className="mt-3">
                <TaskList
                  tasks={completedTasks}
                  title=""
                  emptyMessage=""
                />
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
