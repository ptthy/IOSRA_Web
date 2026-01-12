// app/author/layout.tsx

/* 
MỤC ĐÍCH: Layout chính cho khu vực tác giả (Author Zone)
CHỨC NĂNG CHÍNH:
- Cung cấp layout chung cho tất cả trang trong /author/*
- Sidebar điều hướng với các liên kết chính
- Xử lý thu/gỡ sidebar (collapse/expand)
- Modal mua ký tự AI voice topup
- Highlight menu active dựa trên đường dẫn hiện tại
- Điều hướng giữa các trang trong khu vực tác giả

CẤU TRÚC LAYOUT:
┌─────────────────────────────────────┐
│            Top Navbar               │
├───────────┬─────────────────────────┤
│           │                         │
│  Sidebar  │       Main Content      │
│  (Fixed)  │      (Dynamic)          │
│           │                         │
└───────────┴─────────────────────────┘

QUAN HỆ VỚI CÁC FILE KHÁC:
- Layout cha: app/layout.tsx (global layout)
- Layout con: các page trong /author/* (children props)
- Modal: @/components/payment/VoiceTopupModal
*/
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
  children: React.ReactNode; // Nội dung chính của trang con
}

export default function AuthorLayout({ children }: AuthorLayoutProps) {
  /**
   * STATE QUẢN LÝ UI:
   * - isCollapsed: Kiểm soát trạng thái thu/gỡ sidebar
   *   + false: sidebar mở rộng (w-64)
   *   + true: sidebar thu gọn (w-16)
   * - isVoiceModalOpen: Kiểm soát hiển thị modal mua ký tự AI
   *
   * LÝ DO DÙNG useState:
   * - Component này là client-side (có "use client")
   * - Cần tương tác UI realtime (click để collapse, open modal)
   */
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  /**
   * HOOKS ĐIỀU HƯỚNG:
   * - useRouter: Điều hướng giữa các trang (programmatic navigation)
   * - usePathname: Lấy đường dẫn hiện tại để highlight menu active
   *
   * VÍ DỤ PATHNAME:
   * - /author/overview → isDashboardActive = true
   * - /author/story/123 → isStoriesActive = true
   */
  const router = useRouter();
  const pathname = usePathname();
  /**
   * HÀM ĐIỀU HƯỚNG: Chuyển trang khi click menu
   * @param page - Tên trang (key trong routes object)
   *
   * LOGIC:
   * 1. Dùng mapping object để chuyển đổi tên trang → URL
   * 2. Gọi router.push() để điều hướng
   *
   * ƯU ĐIỂM CỦA MAPPING OBJECT:
   * - Tránh hardcode URL ở nhiều nơi
   * - Dễ bảo trì: thay đổi URL ở 1 chỗ
   * - Type-safe: TypeScript kiểm tra key có tồn tại không
   */
  const handleNavigate = (page: string) => {
    const routes: Record<string, string> = {
      home: "/",
      "author-dashboard": "/author/overview",
      "author-stories": "/author/story",
      "author-rank": "/author/author-upgrade-rank",
      "author-revenue": "/author/revenue",
    };
    router.push(routes[page] || "/"); // Fallback về home nếu không tìm thấy
  };
  /**
   * KIỂM TRA TRANG ACTIVE DỰA TRÊN PATHNAME
   * LOGIC:
   * - isDashboardActive: exact match /author/overview
   * - isStoriesActive: startsWith /author/story hoặc /author/create-story
   *   (vì cả 2 đều thuộc mục "Quản lý Truyện")
   * - isRankActive: exact match /author/author-upgrade-rank
   * - isRevenueActive: exact match /author/revenue
   *
   * LÝ DO DÙNG startsWith CHO STORIES:
   * - /author/story → trang list truyện
   * - /author/story/123 → trang chi tiết truyện
   * - /author/create-story → trang tạo truyện mới
   * Tất cả đều thuộc nhóm "Quản lý Truyện"
   */
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
            {/* NÚT TRẠNG THÁI TRUYỆN */}
            <Button
              variant={isDashboardActive ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => handleNavigate("author-dashboard")}
              title="Dashboard"
            >
              <LayoutDashboard className="h-5 w-5 shrink-0" />
              {/* Conditionally render text when not collapsed */}
              {!isCollapsed && (
                <span className="ml-2 truncate">Trạng Thái Truyện</span>
              )}
            </Button>
            {/* NÚT QUẢN LÝ TRUYỆN */}
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
            {/* NÚT NÂNG CẤP HẠNG */}
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
            {/* NÚT QUẢN LÝ DOANH THU */}
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

            {/* --- NÚT MUA KÝ TỰ  --- */}
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
