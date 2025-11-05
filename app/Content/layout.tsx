// File: app/Content/layout.tsx (CẬP NHẬT)
"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from "@/components/ui/sidebar";
import { EnhancedSidebar } from "./dashboard/components/enhanced-sidebar";
// ✅ SỬA 1: Import Provider
import { ModerationProvider } from "@/context/ModerationContext";

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [currentPage, setCurrentPage] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  // ... (Tất cả logic useEffect, handleNavigate, handleToggleTheme giữ nguyên)
   useEffect(() => {
    // Logic này sẽ dùng URL đúng từ EnhancedSidebar của bạn
    const getCurrentPageFromPath = (path: string) => {
      if (path.includes("/Content/dashboard")) return "dashboard";
      if (path.includes("/Content/review")) {
        if (path.includes("history")) return "history";
        return "content-list";
      }
      if (path.includes("/Content/moderation")) {
        if (path.includes("reports")) return "reports";
        if (path.includes("sent-back")) return "sent-back";
        return "reports"; // Fallback
      }
      if (path.includes("/Content/statistics")) return "statistics";
      if (path.includes("/Content/settings")) return "settings";
      return "dashboard"; // Fallback
    };

    setCurrentPage(getCurrentPageFromPath(pathname));
  }, [pathname]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDark = document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
    }
  }, []);

  const handleNavigate = (page: string) => setCurrentPage(page);

  const handleToggleTheme = () => {
    if (typeof window === "undefined") return;
    const html = document.documentElement;
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);

    if (newMode) {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    // ✅ SỬA 2: Bọc ModerationProvider bên ngoài SidebarProvider
    <ModerationProvider>
      <SidebarProvider>
        <Sidebar
          collapsible="offcanvas"
          className="w-[280px] bg-[var(--primary)] text-[var(--primary-foreground)] border-r-0 shadow-lg transition-colors duration-300"
        >
          {/* EnhancedSidebar bây giờ có thể truy cập Context */}
          <EnhancedSidebar
            currentPage={currentPage}
            onNavigate={handleNavigate}
            isDarkMode={isDarkMode}
            onToggleTheme={handleToggleTheme}
          />
        </Sidebar>

        <SidebarInset>
          <main className="flex-1 p-6 overflow-y-auto transition-colors duration-300">
            {/* {children} (tức là review/page.tsx) bây giờ cũng có thể truy cập Context */}
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ModerationProvider>
  );
}