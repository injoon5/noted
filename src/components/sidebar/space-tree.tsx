"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { SpaceItem } from "./space-item"

interface PageTreeProps {
  spaceId: Id<"spaces">
  parentId?: Id<"pages">
  depth?: number
}

function PageTree({ spaceId, parentId, depth = 1 }: PageTreeProps) {
  const pages = useQuery(
    parentId ? api.pages.listByParent : api.pages.list,
    parentId ? { parentId } : { spaceId }
  )

  if (!pages) return null

  return (
    <>
      {pages.map((page) => (
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
    </>
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
