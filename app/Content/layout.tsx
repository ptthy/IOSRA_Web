/**
 * @layout ContentLayout
 * @description Layout bao quanh toàn bộ khu vực Admin/Moderator.
 * Chức năng:
 * 1. Cấu hình Font Roboto (hỗ trợ tiếng Việt tốt hơn mặc định).
 * 2. Cấu hình Theme (Dark/Light mode) lưu vào LocalStorage.
 * 3. Cung cấp Context (ModerationProvider) để chia sẻ số lượng thông báo (badge count) toàn ứng dụng.
 */
"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Roboto } from "next/font/google";
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from "@/components/ui/sidebar";
import { EnhancedSidebar } from "./dashboard/components/enhanced-sidebar";
import { ModerationProvider } from "@/context/ModerationContext";

const roboto = Roboto({
  subsets: ["latin", "vietnamese"],
  weight: ["100", "300", "400", "500", "700", "900"],
  variable: "--font-roboto",
});

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [currentPage, setCurrentPage] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const getCurrentPageFromPath = (path: string) => {
      if (path.includes("/Content/dashboard")) return "dashboard";
      if (path.includes("/Content/review")) {
        if (path.includes("history")) return "history";
        return "content-list";
      }
      if (path.includes("/Content/chapters")) return "chapters";
      if (path.includes("/Content/moderation")) {
        if (path.includes("reports")) return "reports";
        if (path.includes("sent-back")) return "sent-back";
        return "reports";
      }
      if (path.includes("/Content/statistics")) return "statistics";
      if (path.includes("/Content/tags")) return "tags";
      if (path.includes("/Content/settings")) return "settings";
      return "dashboard";
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
        {/* 👈 3. Áp dụng font cho Sidebar (Menu bên trái) */}
        <Sidebar
          collapsible="offcanvas"
          className={`w-[280px] bg-[var(--primary)] text-[var(--primary-foreground)] border-r-0 shadow-lg transition-colors duration-300 ${roboto.className}`}
        >
          <EnhancedSidebar
            currentPage={currentPage}
            onNavigate={handleNavigate}
            isDarkMode={isDarkMode}
            onToggleTheme={handleToggleTheme}
          />
        </Sidebar>

        {/* 👈 4. Áp dụng font cho SidebarInset (Phần nội dung chính bên phải) */}
        {/* Việc áp dụng vào đây sẽ giúp font kế thừa xuống tất cả {children} */}
        <SidebarInset className={`flex flex-col h-screen ${roboto.className}`}>
          <main className="flex-1 p-6 overflow-y-auto transition-colors duration-300 bg-[var(--background)]">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ModerationProvider>
  );
}
