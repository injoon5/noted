"use client"

import { useState } from "react"
import { Editor } from "@tiptap/react"
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Link,
  Highlighter,
  AlignLeft,
  List,
  ListOrdered,
  Copy,
  ClipboardCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { toast } from "sonner"

interface ToolbarProps {
  editor: Editor
}

interface ToolbarButtonProps {
  onClick: () => void
  isActive?: boolean
  tooltip: string
  children: React.ReactNode
  disabled?: boolean
}

function ToolbarButton({
  onClick,
  isActive,
  tooltip,
  children,
  disabled,
}: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          disabled={disabled}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md text-sm transition-colors",
            isActive
              ? "bg-[hsl(var(--accent-orange))] text-white"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            disabled && "opacity-40 cursor-not-allowed"
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
}

export function EditorToolbar({ editor }: ToolbarProps) {
  const [copied, setCopied] = useState(false)

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href as string
    const url = window.prompt("URL:", previousUrl)
    if (url === null) return
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    // Block javascript: and other non-http(s) schemes to prevent XSS
    if (!/^https?:\/\//i.test(url)) {
      toast.error("Only http:// and https:// URLs are allowed")
      return
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }

  const handleCopyMarkdown = () => {
    const text = editor.getText()
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success("Copied to clipboard!")
    }).catch(() => {
      toast.error("Failed to copy to clipboard")
    })
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1 rounded-full border bg-background/95 backdrop-blur-sm px-2 py-1.5 shadow-lg shadow-black/10">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          tooltip="Bold (⌘B)"
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          tooltip="Italic (⌘I)"
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          tooltip="Strikethrough"
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive("code")}
          tooltip="Inline code"
        >
          <Code className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div className="mx-1 h-4 w-px bg-border" />

        <ToolbarButton
          onClick={setLink}
          isActive={editor.isActive("link")}
          tooltip="Add link"
        >
          <Link className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          isActive={editor.isActive("highlight")}
          tooltip="Highlight"
        >
          <Highlighter className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div className="mx-1 h-4 w-px bg-border" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          tooltip="Bullet list"
        >
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          tooltip="Numbered list"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setParagraph().run()}
          isActive={false}
          tooltip="Clear formatting"
        >
          <AlignLeft className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div className="mx-1 h-4 w-px bg-border" />

        <ToolbarButton
          onClick={handleCopyMarkdown}
          tooltip={copied ? "Copied!" : "Copy as text"}
        >
          {copied ? (
            <ClipboardCheck className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </ToolbarButton>
      </div>
    </TooltipProvider>
  )
}
