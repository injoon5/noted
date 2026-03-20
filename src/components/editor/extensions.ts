import StarterKit from "@tiptap/starter-kit"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import Table from "@tiptap/extension-table"
import TableRow from "@tiptap/extension-table-row"
import TableHeader from "@tiptap/extension-table-header"
import TableCell from "@tiptap/extension-table-cell"
import Image from "@tiptap/extension-image"
import Placeholder from "@tiptap/extension-placeholder"
import CharacterCount from "@tiptap/extension-character-count"
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import Typography from "@tiptap/extension-typography"
import Link from "@tiptap/extension-link"
import Color from "@tiptap/extension-color"
import TextStyle from "@tiptap/extension-text-style"
import Highlight from "@tiptap/extension-highlight"
import { common, createLowlight } from "lowlight"

const lowlight = createLowlight(common)

export const getExtensions = (placeholder = "Start writing, or press '/' for commands…") => [
  StarterKit.configure({
    codeBlock: false, // replaced by CodeBlockLowlight
  }),
  TaskList,
  TaskItem.configure({
    nested: true,
  }),
  Table.configure({
    resizable: true,
  }),
  TableRow,
  TableHeader,
  TableCell,
  Image.configure({
    allowBase64: true,
  }),
  Placeholder.configure({
    placeholder,
  }),
  CharacterCount,
  CodeBlockLowlight.configure({
    lowlight,
  }),
  Typography,
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      rel: "noopener noreferrer",
      target: "_blank",
    },
  }),
  TextStyle,
  Color,
  Highlight.configure({
    multicolor: true,
  }),
]
