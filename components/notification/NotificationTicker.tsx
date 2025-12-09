// components/notification/NotificationTicker.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  notificationService,
  NotificationItem,
} from "@/services/notificationService";
import { Bell, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function NotificationTicker() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  // --- LOGIC API (GIỮ NGUYÊN) ---
  const fetchLatest = async () => {
    try {
      const res = await notificationService.getNotifications(1, 5);
      if (res.data && res.data.items.length > 0) {
        const unread = res.data.items.filter((i) => !i.isRead);
        setNotifications(
          unread.length > 0 ? unread : res.data.items.slice(0, 3)
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchLatest();
    const pollInterval = setInterval(fetchLatest, 60000);
    return () => clearInterval(pollInterval);
  }, []);

  useEffect(() => {
    if (notifications.length <= 1) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % notifications.length);
        setVisible(true);
      }, 300);
    }, 5000);
    return () => clearInterval(interval);
  }, [notifications]);

  if (notifications.length === 0) return null;

  const currentItem = notifications[currentIndex];

  // --- HANDLERS ---
  const handleDeepLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const { type, payload } = currentItem;
    // ... Logic điều hướng giữ nguyên ...
    switch (type) {
      case "voice_purchase":
        router.push("/author/revenue");
        break;
      case "subscription_reminder":
        router.push("/profile");
        break;
      case "new_follower":
        if (payload.followerId) router.push(`/profile/${payload.followerId}`);
        break;
      case "story_rating":
      case "new_story":
        if (payload.storyId) router.push(`/story/${payload.storyId}`);
        break;
      case "chapter_comment":
      case "new_chapter":
        if (payload.storyId && payload.chapterId) {
          router.push(`/reader/${payload.storyId}/${payload.chapterId}`);
        }
        break;
      default:
        router.push("/notification");
        break;
    }
  };

  const handleViewAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push("/notification");
  };

  return (
    // CONTAINER CHÍNH

    <div className="group relative flex items-center justify-end h-8 mr-4 z-50">
      {/* BACKGROUND & BORDER WRAPPER */}
      <div className="flex items-center bg-background/80 backdrop-blur-md border border-border hover:border-blue-400 rounded-full shadow-sm transition-all duration-500 ease-out overflow-hidden">
        {/* ICON CHUÔNG */}
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors z-20">
          <div className="relative">
            <Bell className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 transition-colors" />
            <span className="absolute top-0 right-0 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          </div>
        </div>

        {/* PHẦN NỘI DUNG */}

        <div className="max-w-0 opacity-0 group-hover:max-w-[600px] group-hover:opacity-100 transition-all duration-500 ease-in-out overflow-hidden">
          <div className="flex items-center gap-2 pr-6 py-1 whitespace-nowrap min-w-max">
            {/* Vách ngăn */}
            <div className="h-3 w-[1px] bg-border/60"></div>

            {/* Thông tin tin tức */}
            <div
              onClick={handleDeepLink}
              className={cn(
                "flex flex-col justify-center cursor-pointer transition-transform duration-300",
                visible ? "translate-y-0" : "translate-y-2 opacity-50"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-foreground hover:text-blue-500 hover:underline cursor-pointer max-w-[200px] truncate block">
                  {currentItem.title}
                </span>
                <span className="text-[9px] text-muted-foreground">
                  {formatDistanceToNow(new Date(currentItem.createdAt), {
                    addSuffix: true,
                    locale: vi,
                  })}
                </span>
              </div>
            </div>

            {/* Nút Xem tất cả */}
            <div
              onClick={handleViewAll}
              className="flex items-center gap-1 pl-2 ml-1 border-l border-border/60 text-[10px] font-bold text-blue-500 hover:text-blue-700 cursor-pointer uppercase tracking-wide hover:underline"
            >
              <span>Xem tất cả</span>
              <ChevronRight className="h-3 w-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
