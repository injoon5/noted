import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Noted",
    short_name: "Noted",
    description: "A personal knowledge base. Clean, fast, yours.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0a0a0a",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    categories: ["productivity", "utilities"],
    shortcuts: [
      {
        name: "New Page",
        url: "/",
        description: "Create a new page",
      },
      {
        name: "Tasks",
        url: "/tasks",
        description: "View your tasks",
      },
    ],
  }
}
