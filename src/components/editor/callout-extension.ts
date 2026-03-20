import { Node, mergeAttributes } from "@tiptap/core"

const TYPE_CLASSES: Record<string, string> = {
  info: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950",
  warning: "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950",
  error: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950",
  success: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950",
}

export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "inline*",
  defining: true,

  addAttributes() {
    return {
      type: {
        default: "info",
        parseHTML: (el) => el.getAttribute("data-type"),
        renderHTML: (attrs) => ({ "data-type": attrs.type }),
      },
    }
  },

  parseHTML() {
    return [{ tag: "div[data-callout]" }]
  },

  renderHTML({ HTMLAttributes, node }) {
    const type = (node.attrs.type as string) ?? "info"
    const typeClass = TYPE_CLASSES[type] ?? TYPE_CLASSES.info
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-callout": "",
        class: `rounded-lg border-l-4 p-4 my-3 ${typeClass}`,
      }),
      0,
    ]
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-h": () =>
        this.editor.commands.toggleNode("callout", "paragraph"),
    }
  },
})
