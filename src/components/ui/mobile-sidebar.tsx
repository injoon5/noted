"use client"

import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"
import { Sidebar } from "@/components/sidebar/sidebar"

interface MobileSidebarProps {
  onSearchOpen?: () => void
}

export function MobileSidebar({ onSearchOpen }: MobileSidebarProps) {
  const [open, setOpen] = useState(false)

  // Close on route change (listen for popstate)
  useEffect(() => {
    const handler = () => setOpen(false)
    window.addEventListener("popstate", handler)
    return () => window.removeEventListener("popstate", handler)
  }, [])

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  return (
    <>
      {/* Hamburger trigger — only visible on mobile */}
      <button
        onClick={() => setOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent md:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={[
          "fixed inset-y-0 left-0 z-50 md:hidden",
          "transition-transform duration-300 ease-drawer",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        style={open ? { willChange: "transform" } : undefined}
      >
        <div className="relative h-full">
          <button
            onClick={() => setOpen(false)}
            className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
          <Sidebar onSearchOpen={() => { setOpen(false); onSearchOpen?.() }} />
        </div>
      </div>
    </>
  )
}
