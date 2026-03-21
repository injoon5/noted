"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
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
import { SpaceItem } from "./space-item"

interface PageTreeProps {
  spaceId: Id<"spaces">
  parentId?: Id<"pages">
  depth?: number
}

function PageTree({ spaceId, parentId, depth = 1 }: PageTreeProps) {
  const pagesQuery = useQuery(
    parentId ? api.pages.listByParent : api.pages.list,
    parentId ? { parentId } : { spaceId }
  )
  const [dragOrder, setDragOrder] = useState<string[] | null>(null)
  const reorderPages = useMutation(api.pages.reorder)

  const pages = pagesQuery ?? []
  const displayPages = dragOrder
    ? dragOrder.flatMap((id) => pages.filter((p) => p._id === id))
    : pages

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = displayPages.findIndex((p) => p._id === active.id)
    const newIndex = displayPages.findIndex((p) => p._id === over.id)
    const reordered = arrayMove(displayPages, oldIndex, newIndex)
    setDragOrder(reordered.map((p) => p._id))
    try {
      await reorderPages({ pageIds: reordered.map((p) => p._id) })
    } finally {
      setDragOrder(null)
    }
  }

  if (!displayPages.length) return null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={displayPages.map((p) => p._id)}
        strategy={verticalListSortingStrategy}
      >
        {displayPages.map((page) => (
          <SpaceItem
            key={page._id}
            id={page._id}
            type="page"
            title={page.title}
            icon={page.icon}
            href={`/${spaceId}/${page._id}`}
            depth={depth}
            isFavorite={page.isFavorite}
            spaceId={spaceId}
          >
            <PageTree spaceId={spaceId} parentId={page._id} depth={depth + 1} />
          </SpaceItem>
        ))}
      </SortableContext>
    </DndContext>
  )
}

interface SpaceTreeProps {
  spaceId: Id<"spaces">
  title: string
  icon?: string
}

export function SpaceTree({ spaceId, title, icon }: SpaceTreeProps) {
  return (
    <SpaceItem
      id={spaceId}
      type="space"
      title={title}
      icon={icon}
      href={`/${spaceId}`}
      depth={0}
      defaultExpanded
    >
      <PageTree spaceId={spaceId} />
    </SpaceItem>
  )
}
