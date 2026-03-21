"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ImageIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/utils"
import { Popover, PopoverContent } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface ParentPage {
  _id: string
  title: string
}

interface PageData {
  _id: string
  title: string
  icon?: string | null
  coverImage?: string | null
  updatedAt?: number
  spaceId?: string
  isPublic?: boolean
}

interface PageHeaderProps {
  page: PageData
  spaceName?: string
  parentPages?: ParentPage[]
  wordCount?: number
  onUpdate: (updates: Partial<Omit<PageData, "_id">>) => void
  editable?: boolean
}

const EMPTY_PARENT_PAGES: ParentPage[] = []

const COMMON_EMOJIS = [
  "📄", "📝", "📚", "💡", "🎯", "🔥", "⭐", "✅", "🎨", "🚀",
  "💻", "🌍", "🏠", "💼", "🧪", "📊", "🎵", "🌱", "💰", "🔑",
  "🗺️", "📅", "🔧", "⚡", "🎭", "🌈", "🏆", "🔮", "📌", "🗒️",
]

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  onClose: () => void
}

function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  return (
    <Popover open onOpenChange={(open) => !open && onClose()}>
      <PopoverContent className="p-2 w-64" align="start">
        <div className="grid grid-cols-8 gap-1">
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onSelect(emoji)
                onClose()
              }}
              className="flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-accent transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            onSelect("")
            onClose()
          }}
          className="mt-2 w-full text-left text-xs text-muted-foreground hover:text-foreground px-1 py-0.5"
        >
          Remove icon
        </button>
      </PopoverContent>
    </Popover>
  )
}

interface CoverPickerProps {
  onSelect: (url: string) => void
  onClose: () => void
}

function CoverPicker({ onSelect, onClose }: CoverPickerProps) {
  const [url, setUrl] = useState("")
  return (
    <Popover open onOpenChange={(open) => !open && onClose()}>
      <PopoverContent className="p-3 w-80" align="start">
        <p className="text-xs font-medium mb-2">Cover image URL</p>
        <div className="flex gap-2">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="h-8 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && url) {
                onSelect(url)
                onClose()
              }
            }}
          />
          <Button
            size="sm"
            onClick={() => {
              if (url) {
                onSelect(url)
                onClose()
              }
            }}
          >
            Apply
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Tip: Use an Unsplash URL for beautiful covers
        </p>
      </PopoverContent>
    </Popover>
  )
}

export function PageHeader({
  page,
  spaceName,
  parentPages = EMPTY_PARENT_PAGES,
  wordCount,
  onUpdate,
  editable = true,
}: PageHeaderProps) {
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [showCoverPicker, setShowCoverPicker] = useState(false)

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ title: e.target.value })
  }

  const handleIconSelect = (emoji: string) => {
    onUpdate({ icon: emoji || undefined })
  }

  const handleCoverSelect = (url: string) => {
    onUpdate({ coverImage: url })
  }

  const handleRemoveCover = () => {
    onUpdate({ coverImage: undefined })
  }

  return (
    <div className="w-full">
      {/* Cover image */}
      {page.coverImage ? (
        <div className="relative group mb-6 -mx-8 h-32 overflow-hidden">
          <Image
            src={page.coverImage}
            alt="Cover"
            fill
            sizes="100vw"
            className="object-cover"
          />
          {editable && (
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-3 gap-2">
              <button
                onClick={() => setShowCoverPicker(true)}
                className="rounded bg-white/90 px-2 py-1 text-xs text-black hover:bg-white transition-colors"
              >
                Change cover
              </button>
              <button
                onClick={handleRemoveCover}
                className="flex items-center gap-1 rounded bg-white/90 px-2 py-1 text-xs text-black hover:bg-white transition-colors"
              >
                <X className="h-3 w-3" />
                Remove
              </button>
            </div>
          )}
        </div>
      ) : editable ? (
        <div className="group mb-4 -mx-8 h-12 flex items-end px-8 opacity-0 hover:opacity-100 transition-opacity">
          <button
            onClick={() => setShowCoverPicker(true)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <ImageIcon className="h-3 w-3" />
            Add cover
          </button>
        </div>
      ) : null}

      {/* Icon picker overlay */}
      {showIconPicker && editable && (
        <div className="relative z-50">
          <EmojiPicker
            onSelect={handleIconSelect}
            onClose={() => setShowIconPicker(false)}
          />
        </div>
      )}

      {/* Cover picker overlay */}
      {showCoverPicker && editable && (
        <div className="relative z-50">
          <CoverPicker
            onSelect={handleCoverSelect}
            onClose={() => setShowCoverPicker(false)}
          />
        </div>
      )}

      <div className="px-8 pt-6 pb-2">
        {/* Icon */}
        <div className="mb-4">
          {editable ? (
            <button
              onClick={() => setShowIconPicker(true)}
              className="text-5xl leading-none hover:bg-accent rounded-lg p-1 transition-colors"
              title="Change icon"
            >
              {page.icon || "📄"}
            </button>
          ) : (
            <span className="text-5xl leading-none p-1">
              {page.icon || "📄"}
            </span>
          )}
        </div>

        {/* Breadcrumb */}
        {(spaceName || parentPages.length > 0) && (
          <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
            {spaceName && page.spaceId && (
              <Link
                href={`/${page.spaceId}`}
                className="hover:text-foreground transition-colors"
              >
                {spaceName}
              </Link>
            )}
            {parentPages.map((p) => (
              <span key={p._id} className="flex items-center gap-1">
                <span>/</span>
                <Link
                  href={`/${page.spaceId ?? ""}/${p._id}`}
                  className="hover:text-foreground transition-colors"
                >
                  {p.title || "Untitled"}
                </Link>
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <input
          value={page.title}
          onChange={handleTitleChange}
          readOnly={!editable}
          className={cn(
            "w-full text-3xl font-semibold bg-transparent outline-none placeholder:text-muted-foreground/30 mb-2",
            editable && "cursor-text"
          )}
          placeholder="Untitled"
        />

        {/* Meta info */}
        {(page.updatedAt !== undefined || wordCount !== undefined || page.isPublic) && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4 flex-wrap">
            {page.updatedAt !== undefined && (
              <span>Edited {formatRelativeTime(page.updatedAt)}</span>
            )}
            {wordCount !== undefined && (
              <>
                <span>·</span>
                <span>{wordCount.toLocaleString()} words</span>
              </>
            )}
            {page.isPublic && (
              <>
                <span>·</span>
                <span className="text-green-600">Public</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
