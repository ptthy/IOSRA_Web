

// app/author/layout.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Moon,
  Sun,
  BookOpen,
  LayoutDashboard,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

interface AuthorLayoutProps {
  children: React.ReactNode;
}

export default function AuthorLayout({ children }: AuthorLayoutProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark");
  };

  const handleNavigate = (page: string) => {
    const routes: Record<string, string> = {
      home: "/",
      "author-dashboard": "/author/overview",
      "author-stories": "/author/story",
    };
    router.push(routes[page] || "/");
  };

  const isDashboardActive = pathname === "/author/overview";
  const isStoriesActive =
    pathname.startsWith("/author/story") ||
    pathname.startsWith("/author/create-story");

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`border-r bg-card transition-all duration-300 flex flex-col ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b h-16">
            {!isCollapsed && (
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => handleNavigate("home")}
              >
                <BookOpen className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">ToraNovel</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <Button
              variant={isDashboardActive ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => handleNavigate("author-dashboard")}
            >
              <LayoutDashboard className="h-5 w-5" />
              {!isCollapsed && <span className="ml-2">Dashboard</span>}
            </Button>
            <Button
              variant={isStoriesActive ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => handleNavigate("author-stories")}
            >
              <FileText className="h-5 w-5" />
              {!isCollapsed && <span className="ml-2">Quản lý Truyện</span>}
            </Button>
          </nav>

          {/* Footer */}
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
              onClick={() => handleNavigate("home")}
            >
              <LogOut className="h-5 w-5" />
              {!isCollapsed && <span className="ml-2">Về trang chủ</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
