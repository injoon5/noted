"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ImageIcon, Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/utils"
import { Popover, PopoverContent } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useUploadFile } from "@convex-dev/r2/react"
import { api } from "@/convex/_generated/api"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"

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
  linkedPageId?: string
}

function CoverPicker({ onSelect, onClose, linkedPageId }: CoverPickerProps) {
  const [url, setUrl] = useState("")
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadFile = useUploadFile(api.r2)
  const saveFile = useMutation(api.files.saveFile)

  const handleFileUpload = async (file: File) => {
    setUploading(true)
    try {
      const key = await uploadFile(file)
      // Save metadata to files table
      await saveFile({
        r2Key: key,
        name: file.name,
        size: file.size,
        mimeType: file.type,
        linkedPageId: linkedPageId as Parameters<typeof saveFile>[0]["linkedPageId"],
      })
      // Build a URL — use the R2 public URL pattern or query for it
      // We pass the key as a URL identifier; the cover will be displayed via r2.getUrl
      // For simplicity we use the key prefixed with a marker so the page can resolve it
      onSelect(`r2:${key}`)
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <Popover open onOpenChange={(open) => !open && onClose()}>
      <PopoverContent className="p-3 w-80" align="start">
        <p className="text-xs font-medium mb-2">Cover image</p>

        {/* File upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileUpload(file)
          }}
        />
        <Button
          size="sm"
          variant="outline"
          className="w-full mb-2"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-3.5 w-3.5 mr-1.5" />
          {uploading ? "Uploading..." : "Upload image"}
        </Button>

        <div className="flex items-center gap-2 my-2">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* URL input */}
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

  // Resolve R2 keys stored as "r2:<key>" into signed URLs
  const r2Key = page.coverImage?.startsWith("r2:") ? page.coverImage.slice(3) : null
  const r2Url = useQuery(
    api.files.getUrl,
    r2Key ? { r2Key } : "skip"
  )
  const coverSrc = r2Key ? (r2Url ?? null) : (page.coverImage ?? null)

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ title: e.target.value })
  }

  const handleIconSelect = (emoji: string) => {
    onUpdate({ icon: emoji || null })
  }

  const handleCoverSelect = (url: string) => {
    onUpdate({ coverImage: url })
  }

  const handleRemoveCover = () => {
    onUpdate({ coverImage: null })
  }

  return (
    <div className="w-full">
      {/* Cover image */}
      {coverSrc ? (
        <div className="relative group mb-6 -mx-8 h-32 overflow-hidden">
          <Image
            src={coverSrc}
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
            linkedPageId={page._id}
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
                {page.spaceId ? (
                  <Link
                    href={`/${page.spaceId}/${p._id}`}
                    className="hover:text-foreground transition-colors"
                  >
                    {p.title || "Untitled"}
                  </Link>
                ) : (
                  <span>{p.title || "Untitled"}</span>
                )}
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
