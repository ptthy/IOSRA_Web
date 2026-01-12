//components/notifiction/NotificationItem.tsx
"use client";

import React from "react";
import {
  BookOpen,
  Bell,
  UserPlus,
  MessageSquare,
  Star,
  Info,
  Coins,
  CreditCard,
  Trophy,
  Mic,
} from "lucide-react";
import { cn } from "@/lib/utils"; // Helper để gộp và xử lý className Tailwind CSS một cách linh hoạt
import { NotificationItem as INotificationItem } from "@/services/notificationService";
import { formatDistanceToNow } from "date-fns";
import { format } from "date-fns";
/**
 * Hàm getIcon: Ánh xạ type của thông báo với icon tương ứng
 * Thuật toán: Sử dụng switch-case để mapping:
 * - Mỗi type có icon riêng với màu sắc phù hợp
 * - Mặc định: Info icon với màu xám
 *
 * Visual cue: Màu sắc icon giúp người dùng nhận diện loại thông báo ngay lập tức
 */
const getIcon = (type: string) => {
  switch (type) {
    case "new_chapter":
      return <BookOpen className="h-4 w-4 text-blue-500" />;
    case "subscription_reminder":
      return <Bell className="h-4 w-4 text-yellow-500" />;
    case "new_follower":
      return <UserPlus className="h-4 w-4 text-green-500" />;
    case "chapter_comment":
      return <MessageSquare className="h-4 w-4 text-purple-500" />;
    case "story_rating":
      return <Star className="h-4 w-4 text-orange-500" />;
    case "op_request":
      return <CreditCard className="h-4 w-4 text-emerald-600" />;
    case "chapter_purchase":
      return <Coins className="h-4 w-4 text-yellow-600" />;
    case "author_rank_upgrade":
      return <Trophy className="h-4 w-4 text-pink-500" />;
    case "voice_purchase":
      return <Mic className="h-4 w-4 text-indigo-500" />;
    default:
      return <Info className="h-4 w-4 text-gray-500" />;
  }
};

interface Props {
  item: INotificationItem;
  onClick?: (item: INotificationItem) => void;
}

export const NotificationItem = ({ item, onClick }: Props) => {
  return (
    /**
     * Component hiển thị một thông báo:
     * 1. Có onClick để điều hướng khi click
     * 2. Visual indicator: Background khác cho thông báo chưa đọc
     * 3. Hiển thị icon, title, message và thời gian
     */
    <div
      onClick={() => onClick?.(item)}
      className={cn(
        "flex gap-3 p-3 hover:bg-muted/50 transition-colors cursor-pointer border-b last:border-0",
        // Thông báo chưa đọc có background nổi bật
        !item.isRead && "bg-blue-50/50 dark:bg-blue-900/10"
      )}
    >
      {" "}
      {/* Icon đại diện loại thông báo */}
      <div className="mt-1 shrink-0">{getIcon(item.type)}</div>
      {/* Nội dung thông báo */}
      <div className="flex flex-col gap-1 overflow-hidden">
        {/* Title: In đậm nếu chưa đọc */}
        <span
          className={cn(
            "font-medium text-sm",
            !item.isRead && "text-primary font-bold"
          )}
        >
          {item.title}
        </span>
        {/* Message: Giới hạn 2 dòng với line-clamp */}
        <span className="text-muted-foreground text-xs line-clamp-2">
          {item.message}
        </span>
        {/* Thời gian: Format theo HH:mm - dd/MM/yyyy */}
        <span className="text-[10px] text-muted-foreground/70">
          {format(new Date(item.createdAt), "HH:mm - dd/MM/yyyy")}
        </span>
      </div>
    </div>
  );
};
