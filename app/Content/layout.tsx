
"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from "@/components/ui/sidebar";
import { EnhancedSidebar } from "./dashboard/components/enhanced-sidebar";
import { ModerationProvider } from "@/context/ModerationContext";


export default function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [currentPage, setCurrentPage] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // ✅ SỬA 1: Thêm logic cho 'tags'
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
      if (path.includes("/Content/tags")) return "tags"; // <-- THÊM DÒNG NÀY
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
    <ModerationProvider>
      <SidebarProvider>
        <Sidebar
          collapsible="offcanvas"
          className="w-[280px] bg-[var(--primary)] text-[var(--primary-foreground)] border-r-0 shadow-lg transition-colors duration-300"
        >
          <EnhancedSidebar
            currentPage={currentPage}
            onNavigate={handleNavigate}
            isDarkMode={isDarkMode}
            onToggleTheme={handleToggleTheme}
          />
        </Sidebar>

        {/* Cấu trúc Layout (Giữ nguyên) */}
        <SidebarInset className="flex flex-col h-screen"> 
         
          <main className="flex-1 p-6 overflow-y-auto transition-colors duration-300 bg-[var(--background)]">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ModerationProvider>
  );
}