"use client"

import { Sidebar } from "@/components/sidebar/sidebar"
import { CmdPalette } from "@/components/cmd/cmd-palette"
import { useCmdK } from "@/hooks/useCmdK"
import { OfflineBanner } from "@/components/ui/offline-banner"
import { MobileSidebar } from "@/components/ui/mobile-sidebar"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isOpen, open, close } = useCmdK()

  return (
    <>
      <OfflineBanner />
      <div className="flex h-screen overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden md:flex" data-sidebar>
          <Sidebar onSearchOpen={open} />
        </div>
        <main className="flex-1 overflow-auto" data-main>
          {/* Mobile top bar */}
          <div className="sticky top-0 z-30 flex items-center gap-2 border-b bg-background/80 px-3 py-2 backdrop-blur-sm md:hidden">
            <MobileSidebar onSearchOpen={open} />
            <span className="text-sm font-semibold">Noted</span>
          </div>
          {children}
        </main>
        <CmdPalette isOpen={isOpen} onClose={close} />
      </div>
    </>
  )
}
