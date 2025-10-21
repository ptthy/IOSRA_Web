"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  IconDashboard,
  IconUser,
  IconCash,
  IconCalendarEvent,
  IconHelp,
  IconCoin,
  IconLogout,
} from "@tabler/icons-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Quản lý Author",
      url: "/manage-author",
      icon: IconUser,
    },
    {
      title: "Rút tiền",
      url: "/manage-withdraw",
      icon: IconCash,
    },
    {
      title: "Sự kiện",
      url: "/manage-event",
      icon: IconCalendarEvent,
    },
    {
      title: "Hỗ trợ",
      url: "/manage-support",
      icon: IconHelp,
    },
    {
      title: "Doanh thu",
      url: "/manage-revenue",
      icon: IconCoin,
    },
  ],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  darkMode?: boolean
  toggleDarkMode?: () => void
  onLogout?: () => void
}

export function AppSidebar({
  darkMode = false,
  toggleDarkMode,
  onLogout,
  ...props
}: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <Sidebar
      collapsible="offcanvas"
      className="bg-[var(--card)] border-r border-[var(--border)] shadow-md transition-colors duration-300"
      {...props}
    >
      {/* --- HEADER --- */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-6 border-b border-[var(--border)]"
            >
              <a href="#">
                <h2 className="text-xl font-bold text-[var(--primary)]">
                  Op Moderator
                </h2>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* --- MENU ITEMS --- */}
      <SidebarContent>
        <div className="p-4 space-y-2">
          {data.navMain.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.url

            return (
              <Link
                key={item.url}
                href={item.url}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md"
                    : "hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.title}</span>
              </Link>
            )
          })}
        </div>

        {/* --- LOGOUT BUTTON --- */}
        <div className="mt-auto p-4 border-t border-[var(--border)]">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-destructive border border-[var(--border)] hover:bg-destructive/10"
          >
            <IconLogout className="w-5 h-5" />
            <span className="text-sm font-medium">Đăng xuất</span>
          </button>
        </div>
      </SidebarContent>

      <SidebarFooter>{/* Optional Footer */}</SidebarFooter>
    </Sidebar>
  )
}

export default AppSidebar