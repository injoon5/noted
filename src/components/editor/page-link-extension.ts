import { Node, mergeAttributes } from "@tiptap/core"

export const PageLink = Node.create({
  name: "pageLink",
  group: "inline",
  inline: true,
  selectable: false,
  atom: true,

  addAttributes() {
    return {
      pageId: { default: null },
      title: { default: "" },
      icon: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: "a[data-page-link]" }]
  },

  renderHTML({ HTMLAttributes, node }) {
    const label =
      node.attrs.icon
        ? `${node.attrs.icon as string} ${node.attrs.title as string}`
        : (node.attrs.title as string)

    return [
      "a",
      mergeAttributes(HTMLAttributes, {
        "data-page-link": "",
        href: `/${node.attrs.pageId as string}`,
        class:
          "page-link inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-sm bg-accent hover:bg-accent/80 text-foreground no-underline font-medium",
      }),
      label,
    ]
  },
})
