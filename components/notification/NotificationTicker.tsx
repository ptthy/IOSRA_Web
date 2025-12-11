// components/notification/NotificationTicker.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  notificationService,
  NotificationItem,
} from "@/services/notificationService";
import { Bell, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
// Import HubConnectionBuilder từ signalr
import {
  HubConnectionBuilder,
  HubConnection,
  LogLevel,
} from "@microsoft/signalr";
import { useAuth } from "@/context/AuthContext";

export function NotificationTicker() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  // State điều khiển việc tự động bung ra
  const [forceOpen, setForceOpen] = useState(false);

  const connectionRef = useRef<HubConnection | null>(null);

  // --- 1. Fetch dữ liệu cũ ---
  const fetchLatest = async () => {
    if (!isAuthenticated) return;
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
  }, [isAuthenticated]);

  // --- 2. KẾT NỐI REALTIME (LOGIC GIỐNG HỆT FILE HTML TEST) ---
  useEffect(() => {
    // Nếu chưa đăng nhập thì thôi
    if (!isAuthenticated) {
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
      }
      return;
    }

    const HUB_URL = "https://45-132-75-29.sslip.io/hubs/notifications";

    // Lấy Token đúng key "authToken" (như trong AuthContext)
    const token = localStorage.getItem("authToken") || "";

    // --- BẮT ĐẦU LOGIC KẾT NỐI ---
    const newConnection = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => token,
        // QUAN TRỌNG: KHÔNG thêm skipNegotiation hay transport.
        // Để mặc định cho nó tự chạy giống hệt file HTML.
      })
      .configureLogging(LogLevel.Information) // Log ra để dễ soi
      .withAutomaticReconnect() // Tự kết nối lại nếu rớt mạng
      .build();

    // Lắng nghe sự kiện
    newConnection.on(
      "notificationReceived",
      (notification: NotificationItem) => {
        console.log("📬 Nhận thông báo mới:", notification);

        // Cập nhật giao diện
        setNotifications((prev) => [notification, ...prev]);
        setCurrentIndex(0);
        setVisible(true);

        // --- LOGIC TỰ BUNG RA 10 GIÂY ---
        setForceOpen(true);
        // --- THÊM DÒNG NÀY VÀO ĐÂY ---
        // Bắn sự kiện để Dropdown và Page biết mà load lại
        window.dispatchEvent(new Event("notification-updated"));
        // -----------------------------
        setTimeout(() => {
          setForceOpen(false);
        }, 10000);
      }
    );

    // Start kết nối
    newConnection
      .start()
      .then(() => {
        console.log(`✅ Đã kết nối SignalR thành công (${user?.username})`);
      })
      .catch((err) => {
        console.error("❌ Kết nối thất bại:", err);
      });

    connectionRef.current = newConnection;

    // Cleanup khi component bị hủy
    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
      }
    };
  }, [isAuthenticated]);

  // --- 3. AUTO SLIDE (Hiệu ứng chuyển tin) ---
  useEffect(() => {
    if (notifications.length <= 1 || forceOpen) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % notifications.length);
        setVisible(true);
      }, 300);
    }, 5000);
    return () => clearInterval(interval);
  }, [notifications, forceOpen]);

  if (!isAuthenticated || notifications.length === 0) return null;

  const currentItem = notifications[currentIndex];

  // --- HELPERS & UI ---
  const formatTime = (dateString: string) => {
    try {
      if (!dateString) return "";
      return format(new Date(dateString), "HH:mm - dd/MM/yyyy");
    } catch (e) {
      return "";
    }
  };

  const handleDeepLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentItem) return;
    const { type, payload } = currentItem;

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
    setForceOpen(false);
  };

  const handleViewAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push("/notification");
  };

  return (
    <div className="group relative flex items-center justify-end h-8 mr-4 z-50">
      <div
        className={cn(
          "flex items-center bg-background/80 backdrop-blur-md border border-border rounded-full shadow-sm transition-all duration-500 ease-out overflow-hidden",
          forceOpen
            ? "border-blue-500 max-w-[600px] opacity-100 ring-2 ring-blue-500/20"
            : "hover:border-blue-400 max-w-8 group-hover:max-w-[600px]"
        )}
      >
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors z-20">
          <div className="relative">
            <Bell
              className={cn(
                "h-4 w-4 transition-colors",
                forceOpen
                  ? "text-blue-500"
                  : "text-muted-foreground group-hover:text-blue-500"
              )}
            />
            <span className="absolute top-0 right-0 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          </div>
        </div>

        <div
          className={cn(
            "transition-all duration-500 ease-in-out overflow-hidden",
            forceOpen
              ? "max-w-[600px] opacity-100"
              : "max-w-0 opacity-0 group-hover:max-w-[600px] group-hover:opacity-100"
          )}
        >
          <div className="flex items-center gap-2 pr-6 py-1 whitespace-nowrap min-w-max">
            <div className="h-3 w-[1px] bg-border/60"></div>
            <div
              onClick={handleDeepLink}
              className={cn(
                "flex flex-col justify-center cursor-pointer transition-transform duration-300",
                visible ? "translate-y-0" : "translate-y-2 opacity-50"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-foreground hover:text-blue-500 hover:underline cursor-pointer max-w-[200px] truncate block">
                  {currentItem?.title}
                </span>
                <span className="text-[9px] text-muted-foreground">
                  {currentItem?.createdAt && formatTime(currentItem.createdAt)}
                </span>
              </div>
            </div>
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
