"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  User,
  DollarSign,
  Calendar,
  HelpCircle,
  CircleDollarSign,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { Button } from "@/components/ui/button";
import { authService } from "@/services/authService";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const data = {
  navMain: [
    { title: "Dashboard", url: "/Op/dashboard", icon: LayoutDashboard },
    { title: "Quản lý Author", url: "/Op/manage-author", icon: User },
    { title: "Rút tiền", url: "/Op/manage-withdraw", icon: DollarSign },
    { title: "Sự kiện", url: "/Op/manage-event", icon: Calendar },
    { title: "Hỗ trợ", url: "/Op/manage-support", icon: HelpCircle },
    { title: "Doanh thu", url: "/Op/manage-revenue", icon: CircleDollarSign },
  ],
};

// 🧩 Sửa phần props để nhận darkMode + toggleDarkMode
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export function AppSidebar({
  darkMode,
  toggleDarkMode,
  ...props
}: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout: clientLogout } = useAuth();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

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
      className={`bg-card text-foreground border-none shadow-lg transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
      {...props}
    >
      {/* Header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="data-[slot=sidebar-menu-button]:!p-6 border-b border-white/20 flex justify-between items-center">
              {!isCollapsed && (
                <h2 className="text-xl font-bold">Op Moderator</h2>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                <LayoutDashboard className="w-5 h-5" />
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Menu */}
      <SidebarContent>
        <div className="p-4 space-y-2">
          {data.navMain.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.url);
            return (
              <Link
                key={item.url}
                href={item.url}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                {!isCollapsed && (
                  <span className="text-sm font-medium">{item.title}</span>
                )}
              </Link>
            );
          })}
        </div>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-4 space-y-2 border-t">
        <Button
          variant="ghost"
          onClick={toggleDarkMode}
          className="w-full justify-start"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          {!isCollapsed && (
            <span className="ml-2">
              {darkMode ? "Chế độ sáng" : "Chế độ tối"}
            </span>
          )}
        </Button>

        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span className="ml-2">Đăng xuất</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
