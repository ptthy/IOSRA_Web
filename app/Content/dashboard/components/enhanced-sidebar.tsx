
"use client";

import { useRouter } from "next/navigation";
import {
  BookOpen, BarChart3, FileText, MessageSquare,
  Settings, Bell, History, ChartPie, LogOut,
  Moon, Sun, User, Tags
} from "lucide-react";
import {
  SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem,
  SidebarMenuButton, SidebarGroup, SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useModeration } from "@/context/ModerationContext"; 
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

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
  const { counts } = useModeration();
  const { user, logout } = useAuth();

  const menuItems = [
    { id: "dashboard", label: "Tổng quan", icon: BarChart3, href: "/Content/dashboard" },
    { id: "content-list", label: "Truyện chờ duyệt", icon: BookOpen, badge: counts.pending, href: "/Content/review" },
    { id: "sent-back", label: "Truyện gửi lại", icon: FileText, badge: counts.sentBack, href: "/Content/moderation?tab=sent-back" },
    { id: "reports", label: "Báo cáo vi phạm", icon: MessageSquare, badge: counts.reports, href: "/Content/moderation?tab=reports" },
    { id: "statistics", label: "Thống kê", icon: ChartPie, href: "/Content/statistics" },
    { id: "history", label: "Lịch sử kiểm duyệt", icon: History, href: "/Content/review?tab=history" },
    { id: "tags", label: "Quản lý Tag", icon: Tags, href: "/Content/tags" },
  ];

  const bottomItems = [
    { id: "settings", label: "Cài đặt", icon: Settings, href: "/Content/settings" }
  ];

  const navigateTo = (item: any) => {
    router.push(item.href);
    onNavigate(item.id);
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Đã đăng xuất");
    router.push("/login");
  };

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-4 px-6 h-16 border-b transition-colors duration-300 bg-[var(--card)] border-[var(--border)]">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center shadow-sm flex-shrink-0">
            <BookOpen className="w-6 h-6 text-[var(--primary)]" />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-[var(--foreground)] truncate">ToraNovel</h2>
            <p className="text-xs text-[var(--muted-foreground)] truncate">Content Moderator</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-[var(--card)] text-[var(--foreground)] flex flex-col">
        {/* Banner thông báo */}
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
                {counts.pending > 0 ? `${counts.pending} truyện chờ duyệt` : "Hộp thư trống"}
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1 leading-tight">
                {counts.pending > 0 ? "Hãy kiểm tra ngay" : "Không có truyện mới"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Menu chính */}
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
          </SidebarMenu>

          {/* Group hỗ trợ + Dark mode */}
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

              {/* Dark mode switch */}
              <SidebarMenuItem>
                <div
                  className="flex items-center justify-between p-2 rounded-lg text-[var(--primary)] font-medium hover:bg-[var(--primary)]/10 cursor-pointer"
                  onClick={onToggleTheme}
                >
                  <div className="flex items-center gap-3">
                    {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    <span>{isDarkMode ? "Dark Mode" : "Light Mode"}</span>
                  </div>
                  <Switch checked={isDarkMode} onCheckedChange={onToggleTheme} />
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </div>

        {/* Footer: Tài khoản + Đăng xuất */}
        <div className="mt-auto p-4 border-t border-[var(--border)]">
          <SidebarMenu className="space-y-1">
            <SidebarMenuItem>
              <div
                onClick={() => router.push("/Content/account")}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-[var(--primary)]/10 transition-colors"
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-9 h-9 rounded-full border border-[var(--border)] object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[var(--muted)] flex items-center justify-center font-semibold text-[var(--muted-foreground)]">
                    {user?.username?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                    {user?.username || "Người dùng"}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)] truncate">
                    {user?.email || "Chưa có email"}
                  </p>
                </div>
              </div>
            </SidebarMenuItem>

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