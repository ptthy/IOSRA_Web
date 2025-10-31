"use client";

import { useRouter } from "next/navigation";
import {
  BookOpen,
  BarChart3,
  FileText,
  MessageSquare,
  Settings,
  Bell,
  History,
  ChartPie,
  Moon,
  Sun,
} from "lucide-react";

import {
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  useSidebar, 
} from "@/components/ui/sidebar"; 

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
  const { state } = useSidebar();

  const menuItems = [
    { id: "dashboard", label: "Tổng quan", icon: BarChart3, href: "/Content/dashboard" },
    { id: "content-list", label: "Truyện chờ duyệt", icon: BookOpen, badge: "24", href: "/Content/review" },
    { id: "sent-back", label: "Truyện gửi lại", icon: FileText, badge: "7", href: "/Content/moderation?tab=sent-back" },
    { id: "reports", label: "Báo cáo vi phạm", icon: MessageSquare, badge: "12", href: "/Content/moderation?tab=reports" },
    { id: "statistics", label: "Thống kê", icon: ChartPie, href: "/Content/statistics" },
    { id: "history", label: "Lịch sử kiểm duyệt", icon: History, href: "/Content/review?tab=history" },
  ];

  const bottomItems = [{ id: "settings", label: "Cài đặt", icon: Settings, href: "/Content/settings" }];

  const navigateTo = (item: any) => {
    router.push(item.href);
    onNavigate(item.id);
  };

 
  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center shadow-sm">
            <BookOpen className="w-6 h-6 text-[var(--primary-foreground)]" />
          </div>
          {state === "expanded" && (
            <div>
              <h2 className="font-semibold text-[var(--foreground)]">ToraNovel</h2>
              <p className="text-xs text-[var(--muted-foreground)]">Content Moderator</p>
            </div>
          )}
        </div>

        {/* {state === "expanded" && (
          <motion.button
            onClick={onToggleTheme}
            className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-blue-700" />}
          </motion.button>
        )} */}
      </SidebarHeader>

      {/* Notification Banner (Ẩn khi collapsed) */}
{state === "expanded" && (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 }}
    className="mx-4 mt-2 mb-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--muted)]/20"
  >
    <div className="flex items-start gap-2">
      <Bell className="w-4 h-4 text-[var(--primary)] flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--foreground)] leading-tight">43 thông báo mới</p>
        <p className="text-xs text-[var(--muted-foreground)] mt-1 leading-tight">Có truyện mới cần kiểm duyệt</p>
      </div>
    </div>
  </motion.div>
)}

      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => {
            const active = currentPage === item.id;
            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  onClick={() => navigateTo(item)}
                  isActive={active}
                  tooltip={item.label} // Tự động hiển thị khi collapsed
                  className={cn(
                    active 
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md"
                      : "hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span> 
                  {item.badge && (
                    <Badge className={active ? "bg-white/20 text-white border-0" : "bg-[var(--primary)]/10 text-[var(--primary)] border-0"}>
                      {item.badge}
                    </Badge>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}

          <SidebarGroup className="pt-6 border-t border-[var(--border)] mt-6">
            <SidebarGroupLabel>HỖ TRỢ</SidebarGroupLabel>
            <SidebarMenu>
              {bottomItems.map((item) => {
                const active = currentPage === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => navigateTo(item)}
                      isActive={active}
                      tooltip={item.label}
                      className={cn(
                        active
                          ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md"
                          : "hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
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
      </SidebarContent>

      {/* ✅ SỬA 9: Dùng SidebarFooter */}
      <SidebarFooter>
        <div
          className={cn(
            "flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--muted)]/50 transition-colors cursor-pointer",
            state === "collapsed" && "justify-center"
          )}
        >
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-[var(--primary)] text-[var(--primary-foreground)]">
              MU
            </AvatarFallback>
          </Avatar>

          {state === "expanded" && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--foreground)] truncate">
                Moderator User
              </p>
              <p className="text-xs text-[var(--muted-foreground)] truncate">
                moderator@iosra.com
              </p>
            </div>
          )}
        </div>
      </SidebarFooter>
    </>
  );
}