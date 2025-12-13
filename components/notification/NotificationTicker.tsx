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
import {
  HubConnectionBuilder,
  HubConnection,
  LogLevel,
} from "@microsoft/signalr";
import { useAuth } from "@/context/AuthContext";
// [QUAN TRỌNG] Import thêm 2 cái này để xử lý refresh token thủ công
import { jwtDecode } from "jwt-decode";
import { refreshToken } from "@/services/apiClient";

export function NotificationTicker() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth(); // Lấy user từ context
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);
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

  // --- HÀM HELPER: LẤY TOKEN VÀ TỰ REFRESH NẾU SẮP HẾT HẠN ---
  const getValidAccessToken = async (): Promise<string> => {
    let token = localStorage.getItem("authToken");
    if (!token) return "";

    try {
      const decoded: any = jwtDecode(token);
      const currentTime = Date.now() / 1000;

      // Nếu token còn sống dưới 60 giây nữa -> Gọi Refresh ngay lập tức
      if (decoded.exp < currentTime + 60) {
        console.log("🔄 SignalR: Token sắp hết hạn, đang gọi refresh...");
        try {
          // Gọi hàm refresh từ apiClient (nó sẽ tự lưu vào localStorage)
          token = await refreshToken();
          console.log("✅ SignalR: Đã refresh token thành công");
        } catch (refreshErr) {
          console.error("❌ SignalR: Refresh thất bại", refreshErr);
          return ""; // Trả về rỗng để connection fail, kích hoạt retry sau
        }
      }
    } catch (error) {
      console.error("SignalR: Lỗi decode token", error);
    }
    return token || "";
  };

  // --- 2. KẾT NỐI REALTIME ---
  useEffect(() => {
    if (!isAuthenticated) {
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
      }
      return;
    }

    const HUB_URL = "https://45-132-75-29.sslip.io/hubs/notifications";

    // Build connection
    const newConnection = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        // [QUAN TRỌNG] Dùng hàm async để check token
        accessTokenFactory: getValidAccessToken,
      })
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect({
        // Custom logic retry: Thử lại nhanh lúc đầu, chậm dần về sau
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.elapsedMilliseconds < 60000) {
            return Math.random() * 5000; // < 1 phút: thử lại mỗi 0-5s
          }
          return 10000; // > 1 phút: thử lại mỗi 10s
        },
      })
      .build();

    newConnection.on(
      "notificationReceived",
      (notification: NotificationItem) => {
        console.log("📬 Nhận thông báo:", notification);
        setNotifications((prev) => [notification, ...prev]);
        setCurrentIndex(0);
        setVisible(true);
        setForceOpen(true);
        window.dispatchEvent(new Event("notification-updated"));
        setTimeout(() => setForceOpen(false), 10000);
      }
    );

    const startConnection = async () => {
      try {
        await newConnection.start();
        console.log(`✅ SignalR Connected (${user?.username})`);
      } catch (err) {
        console.error("❌ SignalR Connection Error: ", err);
        // Không cần retry thủ công ở đây vì đã có withAutomaticReconnect
      }
    };

    startConnection();
    connectionRef.current = newConnection;

    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
      }
    };
  }, [isAuthenticated]); // Chỉ chạy lại khi trạng thái login thay đổi

  // --- 3. AUTO SLIDE ---
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

  // --- RENDER UI (Giữ nguyên như cũ) ---
  const currentItem = notifications[currentIndex];
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
        if (payload.storyId && payload.chapterId)
          router.push(`/reader/${payload.storyId}/${payload.chapterId}`);
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
