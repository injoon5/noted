"use client"

import { useState, useEffect } from "react"
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
  const [localPages, setLocalPages] = useState(pagesQuery ?? [])
  const reorderPages = useMutation(api.pages.reorder)

  useEffect(() => {
    if (pagesQuery) setLocalPages(pagesQuery)
  }, [pagesQuery])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = localPages.findIndex((p) => p._id === active.id)
    const newIndex = localPages.findIndex((p) => p._id === over.id)
    const reordered = arrayMove(localPages, oldIndex, newIndex)
    setLocalPages(reordered)
    await reorderPages({ pageIds: reordered.map((p) => p._id) })
  }

  if (!localPages.length) return null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={localPages.map((p) => p._id)}
        strategy={verticalListSortingStrategy}
      >
        {localPages.map((page) => (
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
