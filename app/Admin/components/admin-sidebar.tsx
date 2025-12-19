"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Users, ShieldAlert, LogOut, Banknote } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { Button } from "@/components/ui/button";
import { authService } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";

// 🧭 Danh sách menu chính cho Admin
const data = {
  navMain: [
    { title: "Quản lý Tài khoản", url: "/Admin", icon: Users },
    { title: "Quản lý Biểu phí", url: "/Admin/pricing", icon: Banknote },
  ],
};

interface AdminSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onCollapse?: (val: boolean) => void;
}

export function AdminSidebar({ onCollapse, ...props }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout: clientLogout } = useAuth();

  // Lấy trạng thái từ hook của thư viện (để biết sidebar đang thu gọn hay mở)
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  // Báo cáo trạng thái co giãn về component cha nếu có yêu cầu
  React.useEffect(() => {
    onCollapse?.(isCollapsed);
  }, [isCollapsed, onCollapse]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      clientLogout();
      // Xóa các thông tin đăng nhập
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      document.cookie = `accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
      document.cookie = `refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  return (
    <Sidebar
      collapsible="icon"
      // Thêm font-sans để đảm bảo toàn bộ chữ trong sidebar dùng font Roboto
      className="font-sans border-none shadow-lg bg-white text-slate-900 dark:bg-[#0A2540] dark:text-white"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[slot=sidebar-menu-button]:!p-4 flex items-center gap-3 hover:bg-transparent"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-red-600 text-white shadow-sm shrink-0">
                <ShieldAlert className="size-4" />
              </div>

              {!isCollapsed && (
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="font-roboto font-bold text-lg uppercase tracking-tight">
                    Admin Panel
                  </span>
                  {/* <span className="font-roboto text-[10px] text-muted-foreground uppercase font-semibold">
                    Quản trị hệ thống
                  </span> */}
                </div>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <div className="p-2 space-y-1">
          {data.navMain.map((item) => {
            const Icon = item.icon;
            // Xác định menu nào đang được chọn dựa trên URL
            const isActive =
              item.url === "/Admin"
                ? pathname === "/Admin"
                : pathname.startsWith(item.url);

            return (
              <Link
                key={item.url}
                href={item.url}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold shadow-md"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && (
                  <span className="text-sm font-medium truncate">
                    {item.title}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-gray-200 dark:border-white/10">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={`w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive ${
            isCollapsed ? "px-2" : ""
          }`}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="ml-2 font-medium">Đăng xuất</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
