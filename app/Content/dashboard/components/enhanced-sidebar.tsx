// File: app/Content/dashboard/components/enhanced-sidebar.tsx (CẬP NHẬT)
"use client";

import { useRouter } from "next/navigation";
import {
  BookOpen, BarChart3, FileText, MessageSquare,
  Settings, Bell, History, ChartPie, LogOut,
} from "lucide-react";
import {
  SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem,
  SidebarMenuButton, SidebarGroup, SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
// ✅ SỬA 1: Import hook
import { useModeration } from "@/context/ModerationContext"; 

// ... (Interface EnhancedSidebarProps giữ nguyên)
interface EnhancedSidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export function EnhancedSidebar({
  currentPage,
  onNavigate,
  isDarkMode,
  onToggleTheme,
}: EnhancedSidebarProps) {
  const router = useRouter();
  // ✅ SỬA 2: Lấy 'counts' từ context
  const { counts } = useModeration();

  // ✅ SỬA 3: Dùng 'counts' từ context thay vì số tĩnh
  const menuItems = [
    { id: "dashboard", label: "Tổng quan", icon: BarChart3, href: "/Content/dashboard" },
    { id: "content-list", label: "Truyện chờ duyệt", icon: BookOpen, badge: counts.pending, href: "/Content/review" },
    { id: "sent-back", label: "Truyện gửi lại", icon: FileText, badge: counts.sentBack, href: "/Content/moderation?tab=sent-back" },
    { id: "reports", label: "Báo cáo vi phạm", icon: MessageSquare, badge: counts.reports, href: "/Content/moderation?tab=reports" },
    { id: "statistics", label: "Thống kê", icon: ChartPie, href: "/Content/statistics" },
    { id: "history", label: "Lịch sử kiểm duyệt", icon: History, href: "/Content/review?tab=history" },
  ];

  const bottomItems = [{ id: "settings", label: "Cài đặt", icon: Settings, href: "/Content/settings" }];

  const navigateTo = (item: any) => {
    router.push(item.href);
    onNavigate(item.id);
  };

  const handleLogout = () => {
    router.push("/login");
  };

  return (
    <>
      {/* Header (giữ nguyên) */}
      <SidebarHeader>
        <div className="flex items-center gap-3 p-4 h-16 border-b border-white/20">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shadow-sm flex-shrink-0">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-white truncate">ToraNovel</h2>
            <p className="text-xs text-gray-300 truncate">Content Moderator</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-[var(--card)] text-[var(--foreground)] flex flex-col">
        
        {/* Banner thông báo (giữ nguyên) */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-4 mt-4 p-3 rounded-lg border border-[var(--border)] bg-[var(--muted)]/20"
        >
          <div className="flex items-start gap-2">
            <Bell className="w-4 h-4 text-[var(--primary)] flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--foreground)] leading-tight">
                43 thông báo mới
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1 leading-tight">
                Có truyện mới cần kiểm duyệt
              </p>
            </div>
          </div>
        </motion.div>

        {/* Vùng chứa menu */}
        <div className="p-4 flex-1">
          <SidebarMenu className="space-y-1">
            {menuItems.map((item) => {
              const active = currentPage === item.id;
              return (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => navigateTo(item)}
                    isActive={active}
                    className={cn(
                      "rounded-lg",
                      active
                        ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md"
                        : "text-[var(--primary)] font-medium hover:bg-[var(--primary)]/10"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                    {/* ✅ SỬA 4: Chỉ hiển thị badge nếu số đếm > 0 */}
                    {item.badge && item.badge > 0 && (
                      <Badge
                        className={
                          active
                            ? "bg-white/20 text-white border-0"
                            : "bg-[var(--primary)]/10 text-[var(--primary)] border-0"
                        }
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}

            {/* Group Hỗ trợ (giữ nguyên) */}
            <SidebarGroup className="pt-6 border-t border-[var(--border)] mt-6">
              <SidebarGroupLabel className="text-[var(--muted-foreground)]">HỖ TRỢ</SidebarGroupLabel>
              <SidebarMenu className="space-y-1">
                {bottomItems.map((item) => {
                  const active = currentPage === item.id;
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => navigateTo(item)}
                        isActive={active}
                        className={cn(
                          "rounded-lg",
                          active
                            ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md"
                            : "text-[var(--primary)] font-medium hover:bg-[var(--primary)]/10"
                        )}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarMenu>
        </div>

        {/* Footer (giữ nguyên) */}
        <div className="mt-auto p-4 border-t border-[var(--border)]">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogout}
                className="rounded-lg text-red-500 hover:bg-red-500/10 hover:text-red-500 dark:text-red-400 dark:hover:bg-red-400/10 dark:hover:text-red-400"
              >
                <LogOut className="w-5 h-5" />
                <span>Đăng xuất</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>
    </>
  );
}