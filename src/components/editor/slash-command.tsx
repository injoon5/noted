"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Editor } from "@tiptap/react"
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Minus,
  Table,
  Image as ImageIcon,
  Type,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SlashCommandItem {
  title: string
  description: string
  icon: React.ReactNode
  command: (editor: Editor) => void
}

const COMMANDS: SlashCommandItem[] = [
  {
    title: "Text",
    description: "Plain paragraph text",
    icon: <Type className="h-4 w-4" />,
    command: (editor) => {
      editor.chain().focus().setParagraph().run()
    },
  },
  {
    title: "Heading 1",
    description: "Large section heading",
    icon: <Heading1 className="h-4 w-4" />,
    command: (editor) => {
      editor.chain().focus().toggleHeading({ level: 1 }).run()
    },
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    icon: <Heading2 className="h-4 w-4" />,
    command: (editor) => {
      editor.chain().focus().toggleHeading({ level: 2 }).run()
    },
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    icon: <Heading3 className="h-4 w-4" />,
    command: (editor) => {
      editor.chain().focus().toggleHeading({ level: 3 }).run()
    },
  },
  {
    title: "Bullet List",
    description: "Unordered list",
    icon: <List className="h-4 w-4" />,
    command: (editor) => {
      editor.chain().focus().toggleBulletList().run()
    },
  },
  {
    title: "Numbered List",
    description: "Ordered list",
    icon: <ListOrdered className="h-4 w-4" />,
    command: (editor) => {
      editor.chain().focus().toggleOrderedList().run()
    },
  },
  {
    title: "Task List",
    description: "Checklist with checkboxes",
    icon: <CheckSquare className="h-4 w-4" />,
    command: (editor) => {
      editor.chain().focus().toggleTaskList().run()
    },
  },
  {
    title: "Blockquote",
    description: "Quoted text block",
    icon: <Quote className="h-4 w-4" />,
    command: (editor) => {
      editor.chain().focus().toggleBlockquote().run()
    },
  },
  {
    title: "Code Block",
    description: "Code with syntax highlighting",
    icon: <Code className="h-4 w-4" />,
    command: (editor) => {
      editor.chain().focus().toggleCodeBlock().run()
    },
  },
  {
    title: "Divider",
    description: "Horizontal rule",
    icon: <Minus className="h-4 w-4" />,
    command: (editor) => {
      editor.chain().focus().setHorizontalRule().run()
    },
  },
  {
    title: "Table",
    description: "Insert a table",
    icon: <Table className="h-4 w-4" />,
    command: (editor) => {
      editor
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run()
    },
  },
  {
    title: "Image",
    description: "Insert an image from URL",
    icon: <ImageIcon className="h-4 w-4" />,
    command: (editor) => {
      const url = window.prompt("Enter image URL:")
      if (url) {
        editor.chain().focus().setImage({ src: url }).run()
      }
    },
  },
]

interface SlashCommandMenuProps {
  editor: Editor
  query: string
  onClose: () => void
  position: { top: number; left: number }
}

export function SlashCommandMenu({
  editor,
  query,
  onClose,
  position,
}: SlashCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)

  const filteredCommands = COMMANDS.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(query.toLowerCase()) ||
      cmd.description.toLowerCase().includes(query.toLowerCase())
  )

  const executeCommand = useCallback(
    (cmd: SlashCommandItem) => {
      // Delete the slash and query
      const { from } = editor.state.selection
      editor
        .chain()
        .focus()
        .deleteRange({ from: from - query.length - 1, to: from })
        .run()
      cmd.command(editor)
      onClose()
    },
    [editor, query, onClose]
  )

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((i) =>
          i < filteredCommands.length - 1 ? i + 1 : 0
        )
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((i) =>
          i > 0 ? i - 1 : filteredCommands.length - 1
        )
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex])
        }
      } else if (e.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [filteredCommands, selectedIndex, executeCommand, onClose])

  if (filteredCommands.length === 0) return null

  return (
    <div
      ref={menuRef}
      className="slash-command-menu fixed z-50"
      style={{ top: position.top, left: position.left }}
    >
      {filteredCommands.map((cmd, index) => (
        <button
          key={cmd.title}
          className={cn(
            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
            index === selectedIndex
              ? "bg-accent text-accent-foreground"
              : "hover:bg-accent/50"
          )}
          onClick={() => executeCommand(cmd)}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded border bg-background text-muted-foreground">
            {cmd.icon}
          </span>
          <div>
            <div className="font-medium">{cmd.title}</div>
            <div className="text-xs text-muted-foreground">{cmd.description}</div>
          </div>
        </button>
      ))}
    </div>
  )
}
