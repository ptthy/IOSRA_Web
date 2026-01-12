//components/notifiction/NotificationDropdown.tsx

"use client";

import React, { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  // Đã xóa DropdownMenuHeader và DropdownMenuTitle vì file gốc không có
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  notificationService,
  NotificationItem as INotifItem,
} from "@/services/notificationService";
import { NotificationItem } from "./NotificationItem";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function NotificationDropdown() {
  const router = useRouter();
  /**
   * State quản lý:
   * - items: Danh sách thông báo hiển thị trong dropdown
   * - unreadCount: Số lượng thông báo chưa đọc (hiển thị badge đỏ)
   */
  const [items, setItems] = useState<INotifItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // --- HÀM XỬ LÝ LỖI NỘI BỘ ---
  /**
   * Hàm xử lý lỗi thông minh từ API:
   * 1. Ưu tiên lấy thông báo lỗi chi tiết từ error.response.data.error.details
   * 2. Nếu không có details thì lấy message chung
   * 3. Cuối cùng mới dùng fallback message
   *
   * Thuật toán: Kiểm tra lỗi từ chi tiết đến tổng quát
   * - Chi tiết cụ thể (details) → Message tổng quát → Fallback
   */
  const handleApiError = (error: any, defaultMessage: string) => {
    // Kiểm tra response có cấu trúc error với details không
    if (error.response && error.response.data && error.response.data.error) {
      const { message, details } = error.response.data.error;
      // Ưu tiên hiển thị lỗi chi tiết đầu tiên
      if (details) {
        const firstKey = Object.keys(details)[0];
        if (firstKey && details[firstKey].length > 0) {
          toast.error(details[firstKey].join(" "));
          return;
        }
      }
      // Nếu không có details thì hiển thị message chung
      if (message) {
        toast.error(message);
        return;
      }
    }
    // Cuối cùng dùng fallback message
    const fallbackMsg = error.response?.data?.message || defaultMessage;
    toast.error(fallbackMsg);
  };
  // ----------------------------
  /**
   * Hàm fetchLatest: Lấy 5 thông báo mới nhất
   * Thuật toán:
   * 1. Gọi API với page=1, pageSize=5 (lấy 5 bản ghi đầu)
   * 2. Cập nhật state items với dữ liệu mới
   * 3. Tính toán unreadCount = số item có isRead = false
   */
  const fetchLatest = async () => {
    try {
      // Lấy 5 tin mới nhất để hiện trong dropdown
      const res = await notificationService.getNotifications(1, 5);
      if (res.data) {
        setItems(res.data.items);
        // Tính số thông báo chưa đọc bằng filter
        setUnreadCount(res.data.items.filter((i) => !i.isRead).length);
      }
    } catch (error) {
      handleApiError(error, "Không tải được thông báo");
    }
  };
  /**
   * useEffect: Chạy khi component mount
   * Thuật toán real-time update:
   * 1. Gọi fetchLatest lần đầu
   * 2. Đăng ký sự kiện 'notification-updated' từ window
   * 3. Khi có sự kiện → fetchLatest lại để cập nhật
   * 4. Cleanup: Gỡ bỏ event listener khi component unmount
   *
   * Cơ chế publish-subscribe: NotificationTicker sẽ dispatch event
   * khi nhận thông báo mới → tất cả component lắng nghe sẽ tự động update
   */
  useEffect(() => {
    fetchLatest();

    // Lắng nghe sự kiện từ Ticker để cập nhật real-time
    const handleRealtimeUpdate = () => {
      console.log("🔄 Dropdown: Phát hiện tin mới -> Tải lại data...");
      fetchLatest();
    };
    // Đăng ký event listener
    window.addEventListener("notification-updated", handleRealtimeUpdate);

    // Cleanup: Gỡ bỏ listener khi component bị hủy
    return () => {
      window.removeEventListener("notification-updated", handleRealtimeUpdate);
    };
    // ---------------------
  }, []);

  return (
    /**
     * DropdownMenu với onOpenChange:
     * - Khi mở dropdown (open = true) → gọi fetchLatest để có dữ liệu mới nhất
     * - Đảm bảo người dùng luôn thấy thông báo mới nhất khi click
     */
    <DropdownMenu onOpenChange={(open) => open && fetchLatest()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5" />
          {/* Hiển thị badge đỏ nếu có thông báo chưa đọc */}
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-red-600 border-2 border-background" />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        {/* Header tự custom vì không dùng DropdownMenuHeader */}
        <div className="flex justify-between items-center px-2 py-1.5">
          <span className="font-semibold text-sm">Thông báo</span>
          <span
            onClick={() => router.push("/notification")}
            className="text-xs text-blue-500 cursor-pointer hover:underline"
          >
            Xem tất cả
          </span>
        </div>
        {/* --------------------------------------------------------- */}

        <DropdownMenuSeparator />
        {/* ScrollArea: Cho phép scroll khi có nhiều thông báo */}
        <ScrollArea className="h-[300px]">
          {items.map((item) => (
            <NotificationItem
              key={item.notificationId}
              item={item}
              onClick={() => router.push("/notification")} // Hoặc logic điều hướng riêng
            />
          ))}
          {/* Hiển thị khi không có thông báo */}
          {items.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Không có thông báo mới
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
