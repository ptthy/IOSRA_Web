"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { EnhancedSidebar } from "./dashboard/components/enhanced-sidebar";
import { Separator } from "@/components/ui/separator";
import { ModeSwitcher } from "@/components/mode-switcher";

import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

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
      if (path.includes("/Content/moderation")) {
        if (path.includes("reports")) return "reports";
        if (path.includes("sent-back")) return "sent-back";
        return "reports";
      }
      if (path.includes("/Content/review")) return "content-list";
      if (path.includes("/Content/statistics")) return "statistics";
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
    <SidebarProvider>
      {/* <Sidebar> là component từ thư viện, 
        nó sẽ chứa <EnhancedSidebar> (nội dung sidebar cũ ) 
      */}
      <Sidebar
  collapsible="offcanvas"
  className="bg-[var(--card)] border-r border-[var(--border)] shadow-md transition-colors duration-300"
>
  <EnhancedSidebar
    currentPage={currentPage}
    onNavigate={handleNavigate}
    isDarkMode={isDarkMode}
    onToggleTheme={handleToggleTheme}
  />
</Sidebar>


      <SidebarInset>
        {/* Header */}
    <header className="flex h-14 shrink-0 items-center justify-between border-b px-6 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">


          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <Separator
              orientation="vertical"
              className="mx-3 data-[orientation=vertical]:h-4"
            />
          </div>

          <div className="flex items-center gap-3">
            <ModeSwitcher />
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto transition-colors duration-300">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
