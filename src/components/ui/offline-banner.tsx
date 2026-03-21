"use client"

import { useOffline } from "@/hooks/useOffline"
import { WifiOff } from "lucide-react"

export function OfflineBanner() {
  const { isOffline } = useOffline()

  if (!isOffline) return null

  return (
    <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 bg-yellow-500 px-4 py-2 text-sm font-medium text-yellow-950 animate-in slide-in-from-top duration-300">
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>You&apos;re offline — changes will sync when you reconnect.</span>
    </div>
  )
}
