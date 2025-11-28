"use client";

import { useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/op-sidebar";
import OpHeader from "@/components/op-header";

export default function OpLayout({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
    document.documentElement.classList.toggle("dark", !darkMode);
  };

  return (
    // ✅ BỎ hết style cứng, để thư viện tự tính toán width
    <SidebarProvider defaultOpen={true} className="flex min-h-screen w-full">
      
      {/* 1. Sidebar */}
      <AppSidebar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      {/* 2. Nội dung chính (Inset) */}
      <SidebarInset className="flex flex-1 flex-col overflow-hidden transition-all duration-300 ease-in-out">
        
        {/* Header */}
        <OpHeader />
        
        {/* Nội dung trang (Children) */}
        <div className="flex-1 space-y-4 p-6 pt-6">
          {children}
        </div>

      </SidebarInset>
    </SidebarProvider>
  );
}