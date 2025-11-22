// app/author/layout.tsx

"use client";

import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

interface AuthorLayoutProps {
  children: React.ReactNode;
}

export default function AuthorLayout({ children }: AuthorLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

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
    <div className="min-h-screen bg-background relative">
      {/* --- SIDEBAR --- */}
      <aside
        className={`
          fixed left-0 z-40 border-r bg-card transition-all duration-300 flex flex-col
         
          top-16 
        
          h-[calc(100vh-64px)]
          ${isCollapsed ? "w-16" : "w-64"}
        `}
      >
        <div className="flex flex-col h-full">
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <Button
              variant={isDashboardActive ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => handleNavigate("author-dashboard")}
              title="Dashboard"
            >
              <LayoutDashboard className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span className="ml-2 truncate">Dashboard</span>}
            </Button>

            <Button
              variant={isStoriesActive ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => handleNavigate("author-stories")}
              title="Quản lý Truyện"
            >
              <FileText className="h-5 w-5 shrink-0" />
              {!isCollapsed && (
                <span className="ml-2 truncate">Quản lý Truyện</span>
              )}
            </Button>
          </nav>

          {/* Nút thu gọn (nếu dùng) */}
          {/* <div className="p-4 border-t mt-auto">...</div> */}
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main
        className={`
          flex-1 transition-all duration-300 min-h-screen
          pt-6 
          ${isCollapsed ? "ml-16" : "ml-64"} 
        `}
      >
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
