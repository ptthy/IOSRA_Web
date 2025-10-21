"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export interface NavMainItem {
  title: string
  url: string
  icon?: React.ComponentType<{ className?: string }>
}

interface NavMainProps {
  items: NavMainItem[]
}

export function NavMain({ items }: NavMainProps) {
  const pathname = usePathname()

  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const isActive = pathname === item.url
        const Icon = item.icon

        return (
          <Link
            key={item.url}
            href={item.url}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
              "hover:bg-slate-100 hover:text-slate-900",
              "focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
              isActive
                ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600 font-semibold"
                : "text-slate-600"
            )}
          >
            {Icon && (
              <Icon
                className={cn(
                  "h-5 w-5",
                  isActive ? "text-blue-600" : "text-slate-400"
                )}
              />
            )}
            <span>{item.title}</span>
            
            {/* Hiệu ứng highlight khi active */}
            {isActive && (
              <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}