"use client"

import * as React from "react"
import {
  IconDashboard,
  IconUser,
  IconCash,
  IconCalendarEvent,
  IconHelp,
  IconCoin,
  IconMoon,
  IconLogout,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
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
  user: {
    name: "shadcn",
    // email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "#",
      icon: IconDashboard,
    },
    {
      title: "Quản lý Author",
      url: "#",
      icon: IconUser,
    },
    {
      title: "Rút tiền",
      url: "#",
      icon: IconCash,
    },
    {
      title: "Sự kiện",
      url: "#",
      icon: IconCalendarEvent,
    },
    {
      title: "Hỗ trợ",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Doanh thu",
      url: "#",
      icon: IconCoin,
    },
  ],
  navSecondary: [
   
    {
      title: "Đăng xuất",
      url: "#",
      icon: IconLogout,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                 <NavUser user={data.user} />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <div className="mb-6">
        
          <NavMain items={data.navMain} />
        </div>
        
        <div className="mt-auto">
          <NavMain items={data.navSecondary} />
        </div>
      </SidebarContent>
      <SidebarFooter>
      
      </SidebarFooter>
    </Sidebar>
  )
}