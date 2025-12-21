// app/author/layout.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  Sparkles,
  Trophy,
  CircleDollarSign,
} from "lucide-react";
import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { VoiceTopupModal } from "@/components/payment/VoiceTopupModal";

interface AuthorLayoutProps {
  children: React.ReactNode;
}

export default function AuthorLayout({ children }: AuthorLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const handleNavigate = (page: string) => {
    const routes: Record<string, string> = {
      home: "/",
      "author-dashboard": "/author/overview",
      "author-stories": "/author/story",
      "author-rank": "/author/author-upgrade-rank",
      "author-revenue": "/author/revenue",
    };
    router.push(routes[page] || "/");
  };

  const isDashboardActive = pathname === "/author/overview";
  const isStoriesActive =
    pathname.startsWith("/author/story") ||
    pathname.startsWith("/author/create-story");
  const isRankActive = pathname === "/author/author-upgrade-rank";
  const isRevenueActive = pathname === "/author/revenue";
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
              {!isCollapsed && (
                <span className="ml-2 truncate">Trạng Thái Truyện</span>
              )}
            </Button>

            <Button
              variant={isStoriesActive ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => handleNavigate("author-stories")}
              title="Quản lý Truyện"
            >
              <FileText className="h-5 w-5 shrink-0" />
              {!isCollapsed && (
                <span className="ml-2 truncate">Quản Lý Truyện</span>
              )}
            </Button>
            <Button
              variant={isRankActive ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => handleNavigate("author-rank")}
              title="Nâng cấp Hạng Tác Giả"
            >
              <Trophy className="h-5 w-5 shrink-0 text-amber-500" />
              {!isCollapsed && (
                <span className="ml-2 truncate">Nâng Cấp Hạng Tác Giả</span>
              )}
            </Button>
            <Button
              variant={isRevenueActive ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => handleNavigate("author-revenue")}
              title="Quản Lý Doanh Thu"
            >
              {/* Icon tiền tệ màu xanh lá */}
              <CircleDollarSign className="h-5 w-5 shrink-0 text-green-600" />
              {!isCollapsed && (
                <span className="ml-2 truncate">Quản Lý Doanh Thu</span>
              )}
            </Button>

            {/* --- NÚT MUA KÝ TỰ (Đã sửa: Bỏ border, style y chang nút trên) --- */}
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setIsVoiceModalOpen(true)}
              title="Định Mức Chi Phí"
            >
              {/* Giữ màu tím cho Icon để nhận diện tính năng AI, hoặc xóa class text-indigo-500 nếu muốn đen hoàn toàn */}
              <Sparkles className="h-5 w-5 shrink-0 text-indigo-500" />
              {!isCollapsed && (
                <span className="ml-2 truncate">Định Mức Chi Phí</span>
              )}
            </Button>
          </nav>
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

      {/* --- MODAL --- */}
      <VoiceTopupModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />
    </div>
  );
}
