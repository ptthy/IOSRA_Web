"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { Button } from "./ui/button"; // Đảm bảo bạn đã import Button từ shadcn/ui

// 1. Dữ liệu từ AppSidebar, nhưng đã CẬP NHẬT để dùng icon Lucide
const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/Op/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Quản lý Author",
      url: "/Op/manage-author",
      icon: User,
    },
    {
      title: "Rút tiền",
      url: "/Op/manage-withdraw",
      icon: DollarSign,
    },
    {
      title: "Sự kiện",
      url: "/Op/manage-event",
      icon: Calendar,
    },
    {
      title: "Hỗ trợ",
      url: "/Op/manage-support",
      icon: HelpCircle,
    },
    {
      title: "Doanh thu",
      url: "/Op/manage-revenue",
      icon: CircleDollarSign,
    },
  ],
};

// 2. Interface từ AppSidebar
interface AppSidebarProps {
  onLogout?: () => void;
   darkMode: boolean;
  toggleDarkMode: () => void;
}

// 3. Component chính, kết hợp logic và UI
export function AppSidebar({ darkMode, toggleDarkMode, onLogout }: AppSidebarProps) {
  const pathname = usePathname();
  const [theme, setTheme] = React.useState<"light" | "dark">("light");
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  // 4. Dùng <aside> từ OpSidebar, loại bỏ <main> và {children}
  return (
    <aside
      className={`border-r bg-card transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Header: Giữ lại từ OpSidebar, đổi text logo */}
        <div className="flex items-center justify-between p-4 border-b h-16">
          {!isCollapsed && (
            <span className="text-xl font-bold text-primary">ToraNovel</span>
          )}
          {/* <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-auto"
          > */}
            {/* Dùng icon khác cho collapse, vì LayoutDashboard đã dùng cho nav */}
            {/* <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M9 3v18" />
            </svg>
          </Button> */}
        </div>

        {/* Navigation: Dùng logic map từ AppSidebar + style Button từ OpSidebar */}
        <nav className="flex-1 p-4 space-y-2">
          {data.navMain.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.url);

            return (
              <Button
                key={item.url}
                asChild // Quan trọng: Cho phép Button hoạt động như một Link
                variant={isActive ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                <Link href={item.url}>
                  <Icon className="h-5 w-5" />
                  {!isCollapsed && <span className="ml-2">{item.title}</span>}
                </Link>
              </Button>
            );
          })}
        </nav>

        {/* Footer: Giữ lại từ OpSidebar, nhưng dùng prop onLogout */}
        <div className="p-4 border-t space-y-2">
          <Button
            variant="ghost"
            size={isCollapsed ? "icon" : "default"}
            onClick={toggleTheme}
            className="w-full justify-start"
          >
            {theme === "light" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
            {!isCollapsed && <span className="ml-2">Theme</span>}
          </Button>

          <Button
            variant="ghost"
            size={isCollapsed ? "icon" : "default"}
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onLogout} // Dùng onLogout từ AppSidebar
          >
            <LogOut className="h-5 w-5" />
            {!isCollapsed && <span className="ml-2">Đăng xuất</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
}

export default AppSidebar;
