"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Doc } from "@/convex/_generated/dataModel"
import { useTheme } from "next-themes"
import {
  Search,
  CheckSquare,
  Star,
  Plus,
  Moon,
  Sun,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { NavItem } from "./nav-item"
import { SpaceTree } from "./space-tree"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

interface SidebarProps {
  onSearchOpen?: () => void
}

export function Sidebar({ onSearchOpen }: SidebarProps) {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  const spaces = useQuery(api.spaces.list)
  const favorites = useQuery(api.pages.getFavorites)
  const todayCount = useQuery(api.tasks.getTodayCount)
  const createSpace = useMutation(api.spaces.create)
  const reorderSpaces = useMutation(api.spaces.reorder)


  const [dragOrder, setDragOrder] = useState<string[] | null>(null)

  const spacesList = (spaces ?? []) as Doc<"spaces">[]
  const localSpaces = dragOrder
    ? dragOrder.flatMap((id) => spacesList.filter((s) => s._id === id))
    : spacesList

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = localSpaces.findIndex((s) => s._id === active.id)
    const newIndex = localSpaces.findIndex((s) => s._id === over.id)
    const reordered = arrayMove(localSpaces, oldIndex, newIndex)

    setDragOrder(reordered.map((s) => s._id))
    try {
      await reorderSpaces({ spaceIds: reordered.map((s) => s._id) })
    } catch {
      toast.error("Failed to reorder spaces")
    } finally {
      setDragOrder(null)
    }
  }

  const handleCreateSpace = async () => {
    try {
      await createSpace({ title: "New Space" })
      toast.success("Space created")
    } catch {
      toast.error("Failed to create space")
    }
  }

  if (collapsed) {
    return (
      <div className="flex h-full w-10 flex-col items-center border-r bg-sidebar py-2">
        <button
          onClick={() => setCollapsed(false)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-full w-60 flex-col border-r bg-sidebar">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3">
        <span className="text-sm font-semibold text-sidebar-foreground">Noted</span>
        <button
          onClick={() => setCollapsed(true)}
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-sidebar-accent"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Search */}
      <div className="px-2 pb-2">
        <button
          onClick={onSearchOpen}
          className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
        >
          <Search className="h-4 w-4" />
          <span>Search</span>
          <span className="ml-auto text-xs opacity-60">⌘K</span>
        </button>
      </div>

      <Separator className="mb-1" />

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-0.5 py-1">
          {/* Core nav */}
          <NavItem
            href="/tasks"
            icon={<CheckSquare className="h-4 w-4" />}
            label="Tasks"
            badge={todayCount ?? undefined}
          />

          {/* Favorites */}
          {favorites && favorites.length > 0 && (
            <div className="pt-3">
              <div className="mb-1 px-2.5 text-xs font-medium text-muted-foreground/70">
                Favorites
              </div>
              {(favorites as Doc<"pages">[]).map((page) => (
                <NavItem
                  key={page._id}
                  href={`/${page.spaceId}/${page._id}`}
                  icon={
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  }
                  label={page.title || "Untitled"}
                />
              ))}
            </div>
          )}

          {/* Spaces */}
          <div className="pt-3">
            <div className="mb-1 flex items-center justify-between px-2.5">
              <span className="text-xs font-medium text-muted-foreground/70">
                Spaces
              </span>
              <button
                onClick={handleCreateSpace}
                className="flex h-4 w-4 items-center justify-center rounded text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                title="New space"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>

            {spaces === undefined ? (
              <div className="space-y-1 px-2">
                {["sk-a", "sk-b", "sk-c"].map((k) => (
                  <div
                    key={k}
                    className="h-7 animate-pulse rounded-md bg-sidebar-accent"
                  />
                ))}
              </div>
            ) : spaces.length === 0 ? (
              <div className="px-2.5 py-2 text-xs text-muted-foreground">
                No spaces yet.{" "}
                <button
                  onClick={handleCreateSpace}
                  className="underline hover:text-foreground"
                >
                  Create one
                </button>
              </div>
            ) : (
              <div className="space-y-0.5">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={localSpaces.map((s) => s._id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {localSpaces.map((space) => (
                      <SpaceTree
                        key={space._id}
                        spaceId={space._id}
                        title={space.title}
                        icon={space.icon}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Bottom actions */}
      <div className="border-t px-2 py-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
            title="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
          <NavItem href="/settings" icon={<Settings className="h-4 w-4" />} label="Settings" />
          <button
            onClick={async () => {
              try {
                await authClient.signOut();
              } catch {
                // sign-out failed — clear local state and redirect anyway
              }
              router.push("/auth");
            }}
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
