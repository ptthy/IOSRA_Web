"use client";

import { useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/op-sidebar";
import OpHeader from "@/components/op-header";

export default function OpLayout({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
    document.documentElement.classList.toggle("dark", !darkMode);
  };

  const SIDEBAR_WIDTH_EXPANDED = "16rem"; // = w-64
  const SIDEBAR_WIDTH_COLLAPSED = "4rem";  // = w-16 (bạn có thể đổi lại nếu muốn)

  return (
    <SidebarProvider
      open={!collapsed}
      onOpenChange={(newOpenState) => setCollapsed(!newOpenState)}
      className="h-screen"
      style={{
        "--sidebar-width": SIDEBAR_WIDTH_EXPANDED,
        "--sidebar-width-icon": SIDEBAR_WIDTH_COLLAPSED,
      } as React.CSSProperties}
    >
      <AppSidebar
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />

      {/* SidebarInset đã là thẻ <main> rồi */}
      <SidebarInset className="flex-1 flex flex-col overflow-auto">
        
        {/* Item 1: Header */}
        <OpHeader />
        
        {/* Item 2: Content 
            CHỈ THAY ĐỔI DÒNG DƯỚI ĐÂY:
            Đổi <main> thành <div> để sửa lỗi khoảng trắng.
        */}
        <div className="flex-1 p-4">
          {children}
        </div>

      </SidebarInset>
      
    </SidebarProvider>
  );
}