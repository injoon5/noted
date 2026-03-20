import { Node, mergeAttributes } from "@tiptap/core"

export const ToggleList = Node.create({
  name: "toggleList",
  group: "block",
  content: "block+",
  defining: true,

  parseHTML() {
    return [{ tag: "details" }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "details",
      mergeAttributes(HTMLAttributes, {
        class: "my-2 rounded-md border p-1",
      }),
      0,
    ]
  },
})

export const ToggleSummary = Node.create({
  name: "toggleSummary",
  group: "block",
  content: "inline*",
  defining: true,

  parseHTML() {
    return [{ tag: "summary" }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "summary",
      mergeAttributes(HTMLAttributes, {
        class:
          "cursor-pointer select-none p-2 font-medium hover:bg-accent rounded",
      }),
      0,
    ]
  },
})
