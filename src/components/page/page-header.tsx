"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { ImageIcon, Smile, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  icon?: string
  coverImage?: string
  updatedAt?: number
  wordCount?: number
  onTitleChange?: (title: string) => void
  onIconChange?: (icon: string) => void
  onCoverImageChange?: (url: string | undefined) => void
  editable?: boolean
}

const QUICK_EMOJIS = ["📝", "📌", "💡", "🎯", "📚", "🔥", "⭐", "🏆", "💎", "🚀"]

export function PageHeader({
  title,
  icon,
  coverImage,
  updatedAt,
  wordCount,
  onTitleChange,
  onIconChange,
  onCoverImageChange,
  editable = true,
}: PageHeaderProps) {
  const [isHoveringCover, setIsHoveringCover] = useState(false)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const titleRef = useRef<HTMLDivElement>(null)

  const handleTitleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newTitle = e.currentTarget.textContent ?? ""
    onTitleChange?.(newTitle)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      titleRef.current?.blur()
    }
  }

  const handleAddCover = () => {
    const url = window.prompt("Enter cover image URL:")
    if (url) {
      onCoverImageChange?.(url)
    }
  }

  return (
    <div className="w-full">
      {/* Cover image */}
      {coverImage ? (
        <div
          className="relative h-48 w-full overflow-hidden bg-muted"
          onMouseEnter={() => setIsHoveringCover(true)}
          onMouseLeave={() => setIsHoveringCover(false)}
        >
          <Image
            src={coverImage}
            alt="Cover"
            fill
            className="object-cover"
          />
          {editable && isHoveringCover && (
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/30">
              <button
                onClick={handleAddCover}
                className="rounded-md bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-900 hover:bg-white"
              >
                Change cover
              </button>
              <button
                onClick={() => onCoverImageChange?.(undefined)}
                className="flex items-center gap-1 rounded-md bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-900 hover:bg-white"
              >
                <X className="h-3 w-3" />
                Remove
              </button>
            </div>
          )}
        </div>
      ) : null}

      {/* Header content */}
      <div className="px-8 pt-8 pb-2">
        {/* Icon + add buttons */}
        <div className="group mb-3 flex items-center gap-2">
          {/* Icon */}
          <div className="relative">
            {icon ? (
              <button
                onClick={() => editable && setShowIconPicker(!showIconPicker)}
                className={cn(
                  "text-4xl leading-none transition-opacity",
                  editable && "hover:opacity-75 cursor-pointer"
                )}
              >
                {icon}
              </button>
            ) : editable ? (
              <button
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100"
              >
                <Smile className="h-3.5 w-3.5" />
                Add icon
              </button>
            ) : null}

            {/* Icon picker */}
            {showIconPicker && (
              <div className="absolute top-full left-0 z-50 mt-1 rounded-lg border bg-popover p-2 shadow-md">
                <div className="grid grid-cols-5 gap-1">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onIconChange?.(emoji)
                        setShowIconPicker(false)
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded text-xl hover:bg-accent"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <div className="mt-1 border-t pt-1">
                  <button
                    onClick={() => {
                      onIconChange?.("")
                      setShowIconPicker(false)
                    }}
                    className="w-full rounded px-2 py-1 text-left text-xs text-muted-foreground hover:bg-accent"
                  >
                    Remove icon
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Add cover button */}
          {editable && !coverImage && (
            <button
              onClick={handleAddCover}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              Add cover
            </button>
          )}
        </div>

        {/* Title */}
        <div
          ref={titleRef}
          contentEditable={editable}
          suppressContentEditableWarning
          onInput={handleTitleInput}
          onKeyDown={handleTitleKeyDown}
          onFocus={() => setIsEditingTitle(true)}
          onBlur={() => setIsEditingTitle(false)}
          className={cn(
            "text-3xl font-bold tracking-tight outline-none empty:before:text-muted-foreground empty:before:content-['Untitled'] min-h-[1em]",
            editable && "cursor-text"
          )}
          style={{ wordBreak: "break-word" }}
        >
          {title}
        </div>

        {/* Meta info */}
        {(updatedAt || wordCount !== undefined) && (
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            {updatedAt && (
              <span>Edited {formatRelativeTime(updatedAt)}</span>
            )}
            {wordCount !== undefined && (
              <span>{wordCount.toLocaleString()} words</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
