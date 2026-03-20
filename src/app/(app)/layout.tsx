"use client"

import { Sidebar } from "@/components/sidebar/sidebar"
import { CmdPalette } from "@/components/cmd/cmd-palette"
import { useCmdK } from "@/hooks/useCmdK"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isOpen, open, close } = useCmdK()

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar onSearchOpen={open} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      <CmdPalette isOpen={isOpen} onClose={close} />
    </div>
  )
}
