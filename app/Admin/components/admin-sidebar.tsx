"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Users,
  ShieldAlert,
  Settings,
  LogOut,
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

// 🧭 Danh sách menu chính cho Admin
const data = {
  navMain: [
    { title: "Quản lý Tài khoản", url: "/Admin", icon: Users },
    // { title: "Cấu hình hệ thống", url: "/Admin/settings", icon: Settings }, 
  ],
};

// 🧩 Interface props (Đã bỏ darkMode, toggleDarkMode)
interface AdminSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onCollapse?: (val: boolean) => void;
}

export function AdminSidebar({
  onCollapse,
  ...props
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout: clientLogout } = useAuth();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // Hàm xử lý thu gọn sidebar
  const toggleCollapse = () => {
    const newVal = !isCollapsed;
    setIsCollapsed(newVal);
    onCollapse?.(newVal);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      clientLogout();
      // Xóa sạch storage và cookie
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      document.cookie = `accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
      document.cookie = `refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
      
      // toast.success("Đã đăng xuất");
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  return (
    <Sidebar
      collapsible="offcanvas"
      className={`transition-all duration-300 border-none shadow-lg ${
        isCollapsed ? "w-16" : "w-64"
      } bg-white text-slate-900 dark:bg-[#0A2540] dark:text-white`}
      {...props}
    >
      {/* ===== Header ===== */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              size="lg"
              className="data-[slot=sidebar-menu-button]:!p-4 flex items-center gap-3 hover:bg-transparent"
            >
              {/* Logo Admin */}
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-red-600 text-white shadow-sm">
                <ShieldAlert className="size-4" />
              </div>
              
              {!isCollapsed && (
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold text-lg">Admin Panel</span>
                  <span className="truncate text-xs text-muted-foreground">System Management</span>
                </div>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ===== Menu chính ===== */}
      <SidebarContent>
        <div className="p-4 space-y-2">
          {data.navMain.map((item) => {
            const Icon = item.icon;
            // Kiểm tra active
            const isActive = item.url === "/Admin" 
              ? pathname === "/Admin" 
              : pathname.startsWith(item.url);

            return (
              <Link
                key={item.url}
                href={item.url}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold shadow-md"
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

      {/* ===== Footer ===== */}
      <SidebarFooter className="p-4 space-y-2 border-t border-gray-200 dark:border-white/10">
        {/* Nút Logout (Đã bỏ DarkMode button) */}
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span className="ml-2">Đăng xuất</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}