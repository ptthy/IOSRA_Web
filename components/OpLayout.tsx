"use client";

import { useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/op-sidebar";
// ✅ Import OpHeader (Header riêng cho Admin)
import OpHeader from "@/components/op-header"; 

export default function OpLayout({ children }: { children: React.ReactNode }) {
  // State xử lý DarkMode (nếu bạn muốn toggle từ Sidebar)
  const [darkMode, setDarkMode] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
    document.documentElement.classList.toggle("dark", !darkMode);
  };

  // Cấu hình độ rộng Sidebar (nếu cần chỉnh CSS custom)
  const SIDEBAR_WIDTH_EXPANDED = "16rem"; 
  const SIDEBAR_WIDTH_COLLAPSED = "4rem"; 

  return (
    <SidebarProvider
      open={!collapsed}
      onOpenChange={(newOpenState) => setCollapsed(!newOpenState)}
      className="h-screen w-full" // Thêm w-full để đảm bảo full width
      style={{
        "--sidebar-width": SIDEBAR_WIDTH_EXPANDED,
        "--sidebar-width-icon": SIDEBAR_WIDTH_COLLAPSED,
      } as React.CSSProperties}
    >
      {/* Sidebar nằm bên trái */}
      <AppSidebar
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />

      {/* Phần nội dung bên phải (Inset) */}
      <SidebarInset className="flex flex-col h-full overflow-hidden">
        
        {/* 1. OpHeader nằm dính ở trên cùng */}
        <OpHeader />
        
        {/* 2. Khu vực nội dung chính (children) */}
        {/* flex-1 và overflow-auto để chỉ có vùng này cuộn, header đứng yên */}
        <div className="flex-1 p-6 overflow-auto bg-background">
          {children}
        </div>

      </SidebarInset>
    </SidebarProvider>
  );
}