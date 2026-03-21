"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  badge?: number
  onClick?: () => void
}

export function NavItem({ href, icon, label, badge, onClick }: NavItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 rounded-md py-1.5 text-sm transition-colors border-l-2",
        isActive
          ? "border-[hsl(var(--accent-orange))] bg-sidebar-accent/80 text-sidebar-accent-foreground font-medium pl-[calc(0.625rem-2px)] pr-2.5"
          : "border-transparent text-sidebar-foreground hover:bg-sidebar-accent/50 px-2.5"
      )}
    >
      <span className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center",
        isActive ? "text-[hsl(var(--accent-orange))]" : "text-muted-foreground"
      )}>
        {icon}
      </span>
      <span className="flex-1 truncate">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[hsl(var(--accent-orange))] px-1 text-[10px] font-medium text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  )
}
