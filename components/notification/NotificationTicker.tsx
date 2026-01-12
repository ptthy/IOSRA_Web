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
import { cn } from "@/lib/utils"; // Helper để gộp và xử lý className Tailwind CSS một cách linh hoạt
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
  /**
   * State quản lý:
   * - notifications: Danh sách thông báo hiển thị trong ticker
   * - currentIndex: Index của thông báo đang hiển thị (cho chế độ slideshow)
   * - visible: Control hiệu ứng fade in/out
   * - forceOpen: Khi có thông báo mới → mở rộng ticker trong 10s
   */
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [forceOpen, setForceOpen] = useState(false);

  const connectionRef = useRef<HubConnection | null>(null);

  // --- 1. FETCH DỮ LIỆU CŨ ---
  /**
   * Hàm fetchLatest: Lấy thông báo từ server
   * Logic ưu tiên:
   * 1. Chỉ fetch khi đã đăng nhập (isAuthenticated)
   * 2. Ưu tiên hiển thị thông báo chưa đọc
   * 3. Nếu không có thông báo chưa đọc → hiển thị 3 thông báo mới nhất
   */
  const fetchLatest = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationService.getNotifications(1, 5);
      if (res.data && res.data.items.length > 0) {
        // Lọc thông báo chưa đọc
        const unread = res.data.items.filter((i) => !i.isRead);
        // Ưu tiên hiển thị thông báo chưa đọc, nếu không có thì lấy 3 thông báo mới nhất
        setNotifications(
          unread.length > 0 ? unread : res.data.items.slice(0, 3)
        );
      }
    } catch (error) {
      console.error(error);
    }
  };
  // Fetch dữ liệu ban đầu khi component mount hoặc trạng thái auth thay đổi
  useEffect(() => {
    fetchLatest();
  }, [isAuthenticated]);

  // --- HÀM HELPER: LẤY TOKEN VÀ TỰ REFRESH NẾU SẮP HẾT HẠN ---
  /**
   * Thuật toán token management cho SignalR:
   * 1. Lấy token từ localStorage
   * 2. Decode token để kiểm tra thời gian hết hạn (exp)
   * 3. Nếu token còn < 60s hết hạn → gọi refreshToken()
   * 4. Trả về token hợp lệ để kết nối SignalR
   *
   * Tại sao cần làm điều này?
   * - SignalR connection sống lâu, token có thể hết hạn trong lúc kết nối
   * - Cần refresh token trước khi hết hạn để tránh disconnect
   */
  const getValidAccessToken = async (): Promise<string> => {
    let token = localStorage.getItem("authToken");
    // if (!token) return "";
    if (!token) throw new Error("No token available"); // Không trả về ""

    try {
      // Decode token để lấy thông tin exp (expiration time)
      const decoded: any = jwtDecode(token);
      const currentTime = Date.now() / 1000; // Chuyển sang seconds
      // Nếu token còn dưới 60 giây nữa là hết hạn
      if (decoded.exp < currentTime + 60) {
        // Gọi refresh token và cập nhật token mới
        token = await refreshToken(); // Tự động refresh token
      }
      return token || "";
    } catch (error) {
      throw new Error("Token invalid or expired");
    }
  };
  // --- 2. KẾT NỐI REALTIME VỚI SIGNALR ---
  /**
   * useEffect quản lý kết nối SignalR:
   * 1. Chỉ kết nối khi user đã đăng nhập
   * 2. Tạo HubConnection với URL và accessTokenFactory
   * 3. Configure automatic reconnect với retry delay tăng dần
   * 4. Lắng nghe event "notificationReceived" từ server
   * 5. Dispatch event "notification-updated" để các component khác biết
   *
   * Thuật toán reconnect:
   * - < 1 phút: retry mỗi 0-5s (ngẫu nhiên để tránh thundering herd)
   * - > 1 phút: retry mỗi 10s
   */
  useEffect(() => {
    // Nếu chưa đăng nhập, dừng kết nối nếu có
    if (!isAuthenticated) {
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
      }
      return;
    }
    /**

 * 
 * 1. "https://" → Dùng HTTPS để mã hóa kết nối (bảo mật)
 * 2. "45-132-75-29.sslip.io" → Địa chỉ server (IP: 45.132.75.29)
 * 3. "/hubs/notifications" → Đường dẫn đến Notification Hub
 * 
 * MỤC ĐÍCH:
 * - Kết nối WebSocket với server để nhận thông báo real-time
 * - Server sẽ "push" thông báo mới ngay lập tức qua kết nối này
 * - Không cần phải gọi API liên tục (polling)
 * 
 * VÍ DỤ HOẠT ĐỘNG:
 * Khi có chapter mới → Server gửi qua HUB_URL → App hiện thông báo ngay
 */
    const HUB_URL = "https://45-132-75-29.sslip.io/hubs/notifications";

    // Build connection
    const newConnection = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        // [QUAN TRỌNG]  Sử dụng hàm async để luôn có token hợp lệ
        accessTokenFactory: getValidAccessToken,
      })
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect({
        // Custom retry logic với exponential backoff nhẹ
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.elapsedMilliseconds < 60000) {
            // Dưới 1 phút: retry nhanh (0-5s ngẫu nhiên)
            return Math.random() * 5000; // < 1 phút: thử lại mỗi 0-5s
          }
          return 10000; // Trên 1 phút: retry chậm (10s)
        },
      })
      .build();
    // Lắng nghe sự kiện thông báo mới từ server
    newConnection.on(
      "notificationReceived",
      (notification: NotificationItem) => {
        console.log("📬 Nhận thông báo:", notification);
        // 1. Thêm thông báo mới vào đầu mảng
        setNotifications((prev) => [notification, ...prev]);
        // 2. Reset về hiển thị thông báo đầu tiên
        setCurrentIndex(0);
        setVisible(true);
        // 3. Mở rộng ticker trong 10 giây
        setForceOpen(true);
        // 4. Dispatch event để các component khác (Dropdown) cập nhật
        window.dispatchEvent(new Event("notification-updated"));
        setTimeout(() => setForceOpen(false), 10000);
      }
    );
    /**
     * Hàm startConnection với error handling thông minh:
     * 1. Kiểm tra connection state trước khi start
     * 2. Xử lý lỗi mạng/server gracefully
     * 3. Không spam console.error
     */
    const startConnection = async () => {
      // Tránh tạo nhiều kết nối chồng chéo
      if (newConnection.state !== "Disconnected") return;

      try {
        await newConnection.start();
        console.log(`✅ SignalR Connected`);
      } catch (err) {
        // Kiểm tra nếu mất mạng
        // Thay vì console.error, hãy kiểm tra xem có phải lỗi mạng không
        if (!window.navigator.onLine) {
          console.warn(
            "⚠️ Mất kết nối mạng, SignalR sẽ tự kết nối lại khi có mạng."
          );
        } else {
          // Chỉ log warn nhẹ nhàng thay vì báo đỏ cả console
          console.warn("⚠️ Server chưa sẵn sàng, đang đợi kết nối lại...");
        }
      }
    };

    startConnection();
    connectionRef.current = newConnection;
    // Cleanup: Dừng kết nối khi component unmount
    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
      }
    };
  }, [isAuthenticated]); // Chỉ chạy lại khi trạng thái login thay đổi

  // --- 3. AUTO SLIDE (SLIDESHOW) CHO TICKER ---
  /**
   * Thuật toán slideshow tự động:
   * 1. Chỉ chạy khi có >1 thông báo và không đang forceOpen
   * 2. Mỗi 5s: Ẩn thông báo hiện tại → chuyển index → hiện thông báo mới
   * 3. Hiệu ứng fade in/out với CSS transition
   */
  useEffect(() => {
    if (notifications.length <= 1 || forceOpen) return;
    const interval = setInterval(() => {
      // Ẩn thông báo hiện tại
      setVisible(false);
      // Sau 300ms (đủ cho fade out), chuyển sang thông báo tiếp theo

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % notifications.length);
        setVisible(true);
      }, 300);
    }, 5000);
    return () => clearInterval(interval);
  }, [notifications, forceOpen]);
  // Không render nếu chưa đăng nhập hoặc không có thông báo
  if (!isAuthenticated || notifications.length === 0) return null;

  // --- CÁC HÀM XỬ LÝ UI ---
  const currentItem = notifications[currentIndex];
  /**
   * Hàm formatTime: Format thời gian thành HH:mm - dd/MM/yyyy
   * Có try-catch để tránh crash nếu dateString invalid
   */
  const formatTime = (dateString: string) => {
    try {
      if (!dateString) return "";
      return format(new Date(dateString), "HH:mm - dd/MM/yyyy");
    } catch (e) {
      return "";
    }
  };
  /**
   * Hàm handleDeepLink: Điều hướng thông minh dựa trên type của thông báo
   * Thuật toán mapping:
   * - Dựa vào type và payload để điều hướng đến route phù hợp
   * - Mỗi loại thông báo có destination riêng
   */
  const handleDeepLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentItem) return;
    const { type, payload } = currentItem;
    switch (type) {
      case "voice_purchase":
      case "op_request": // Rút tiền
      case "chapter_purchase": // Người khác mua chương
        router.push("/author/revenue");
        break;
      case "author_rank_upgrade":
        router.push("/author/author-upgrade-rank");
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
      {/* Container chính với hiệu ứng expand/collapse */}
      <div
        className={cn(
          "flex items-center bg-background/80 backdrop-blur-md border border-border rounded-full shadow-sm transition-all duration-500 ease-out overflow-hidden",
          forceOpen
            ? "border-blue-500 max-w-[600px] opacity-100 ring-2 ring-blue-500/20"
            : "hover:border-blue-400 max-w-8 group-hover:max-w-[600px]"
        )}
      >
        {/* Icon chuông với badge thông báo */}
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
            {/* Badge đỏ với hiệu ứng ping */}
            <span className="absolute top-0 right-0 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          </div>
        </div>
        {/* Nội dung thông báo (expandable) */}
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
            {/* Thông báo hiện tại với hiệu ứng fade */}
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
            {/* Nút "Xem tất cả" */}
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
