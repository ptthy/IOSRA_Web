"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IconDashboard,
  IconUser,
  IconCash,
  IconCalendarEvent,
  IconHelp,
  IconCoin,
  IconLogout,
} from "@tabler/icons-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { authService } from "@/services/authService";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const data = {
  navMain: [
    { title: "Dashboard", url: "/Op/dashboard", icon: IconDashboard },
    { title: "Quản lý Author", url: "/Op/manage-author", icon: IconUser },
    { title: "Rút tiền", url: "/Op/manage-withdraw", icon: IconCash },
    { title: "Sự kiện", url: "/Op/manage-event", icon: IconCalendarEvent },
    { title: "Hỗ trợ", url: "/Op/manage-support", icon: IconHelp },
    { title: "Doanh thu", url: "/Op/manage-revenue", icon: IconCoin },
  ],
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  darkMode?: boolean;
  toggleDarkMode?: () => void;
}

export function AppSidebar({
  darkMode,
  toggleDarkMode,
  ...props
}: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout: clientLogout } = useAuth();

  const handleLogout = async () => {
    try {
      await authService.logout();

      clientLogout();
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");

      document.cookie = `accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
      document.cookie = `refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;

      toast.success("Đã đăng xuất");
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  return (
    <Sidebar
      collapsible="offcanvas"
      className="bg-[#073763] text-white border-none shadow-lg"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="data-[slot=sidebar-menu-button]:!p-6 border-b border-white/20">
              <h2 className="text-xl font-bold">Op Moderator</h2>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="bg-white dark:bg-[#0b2447]">
        <div className="p-4 space-y-2">
          {data.navMain.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.url);

            return (
              <Link
                key={item.url}
                href={item.url}
                className={`
            w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
            ${
              isActive
                ? "bg-[#073763] text-white font-semibold dark:bg-white dark:text-[#073763]"
                : "text-gray-700 hover:bg-[#e8f0fa] hover:text-[#073763] dark:text-gray-200 dark:hover:bg-[#112c4a] dark:hover:text-white"
            }
          `}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.title}</span>
              </Link>
            );
          })}
        </div>

        <div className="mt-auto p-4 border-t border-gray-200 dark:border-white/10">
          <button
            onClick={handleLogout}
            className="
        w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 
        border border-gray-300 bg-white text-gray-700 
        hover:bg-[#f3f7fd] 
        dark:bg-[#0b2447] dark:text-gray-200 dark:border-white/20 dark:hover:bg-[#112c4a]
      "
          >
            <IconLogout className="w-5 h-5" />
            <span className="text-sm font-medium">Đăng xuất</span>
          </button>
        </div>
      </SidebarContent>

      <SidebarFooter />
    </Sidebar>
  );
}

export default AppSidebar;
