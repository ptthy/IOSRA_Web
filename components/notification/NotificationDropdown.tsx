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
  const [items, setItems] = useState<INotifItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // --- HÀM XỬ LÝ LỖI NỘI BỘ ---
  const handleApiError = (error: any, defaultMessage: string) => {
    if (error.response && error.response.data && error.response.data.error) {
      const { message, details } = error.response.data.error;
      if (details) {
        const firstKey = Object.keys(details)[0];
        if (firstKey && details[firstKey].length > 0) {
          toast.error(details[firstKey].join(" "));
          return;
        }
      }
      if (message) {
        toast.error(message);
        return;
      }
    }
    const fallbackMsg = error.response?.data?.message || defaultMessage;
    toast.error(fallbackMsg);
  };
  // ----------------------------

  const fetchLatest = async () => {
    try {
      const res = await notificationService.getNotifications(1, 5);
      if (res.data) {
        setItems(res.data.items);
        setUnreadCount(res.data.items.filter((i) => !i.isRead).length);
      }
    } catch (error) {
      handleApiError(error, "Không tải được thông báo");
    }
  };

  useEffect(() => {
    fetchLatest();
  }, []);

  return (
    <DropdownMenu onOpenChange={(open) => open && fetchLatest()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-red-600 border-2 border-background" />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        {/* --- SỬA LỖI Ở ĐÂY: Thay thế Header/Title bằng div/span --- */}
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

        <ScrollArea className="h-[300px]">
          {items.map((item) => (
            <NotificationItem
              key={item.notificationId}
              item={item}
              onClick={() => router.push("/notification")} // Hoặc logic điều hướng riêng
            />
          ))}
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
