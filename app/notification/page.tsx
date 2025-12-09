// app/notification/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { format } from "date-fns";
import {
  Bell,
  Loader2,
  CheckCheck,
  BookOpen,
  UserPlus,
  MessageSquare,
  Star,
  Info,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import {
  notificationService,
  NotificationItem as INotifItem,
} from "@/services/notificationService";
import { cn } from "@/lib/utils";

// --- COMPONENT HIỂN THỊ ROW (Nội bộ cho trang này) ---
const NotificationRow = ({
  item,
  onClick,
}: {
  item: INotifItem;
  onClick: (item: INotifItem) => void;
}) => {
  const getIcon = (type: string) => {
    switch (type) {
      case "new_chapter":
      case "new_story":
        return <BookOpen className="h-5 w-5 text-blue-500" />;
      case "subscription_reminder":
        return <Bell className="h-5 w-5 text-yellow-500" />;
      case "new_follower":
        return <UserPlus className="h-5 w-5 text-green-500" />;
      case "chapter_comment":
        return <MessageSquare className="h-5 w-5 text-purple-500" />;
      case "story_rating":
        return <Star className="h-5 w-5 text-orange-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const timeDisplay = format(new Date(item.createdAt), "HH:mm - dd/MM/yyyy");

  return (
    <div
      onClick={() => onClick(item)}
      className={cn(
        "flex gap-4 p-4 border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer items-start",
        !item.isRead ? "bg-blue-50/60 dark:bg-blue-900/10" : "bg-card"
      )}
    >
      <div className="mt-1 shrink-0 bg-background p-2 rounded-full border shadow-sm">
        {getIcon(item.type)}
      </div>
      <div className="flex flex-col gap-1 overflow-hidden flex-1">
        <div className="flex justify-between items-start gap-2">
          <span
            className={cn(
              "text-sm font-semibold",
              !item.isRead ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {item.title}
          </span>
          <span className="text-xs text-muted-foreground/60 whitespace-nowrap shrink-0">
            {timeDisplay}
          </span>
        </div>

        <span className="text-sm text-muted-foreground line-clamp-2">
          {item.message}
        </span>
      </div>
      {!item.isRead && (
        <div className="self-center shrink-0 ml-2">
          <div className="h-3 w-3 rounded-full bg-blue-500 shadow-sm animate-pulse" />
        </div>
      )}
    </div>
  );
};

export default function NotificationPage() {
  const router = useRouter();

  // State
  const [notifications, setNotifications] = useState<INotifItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20); // Cố định 20 items/trang
  const [total, setTotal] = useState(0);

  // --- HÀM XỬ LÝ LỖI (Nằm ngay trong file) ---
  const handleApiError = (error: any, defaultMessage: string) => {
    if (error.response && error.response.data && error.response.data.error) {
      const { message, details } = error.response.data.error;
      // Ưu tiên Validation (details)
      if (details) {
        const firstKey = Object.keys(details)[0];
        if (firstKey && details[firstKey].length > 0) {
          toast.error(details[firstKey].join(" "));
          return;
        }
      }
      // Message từ Backend
      if (message) {
        toast.error(message);
        return;
      }
    }
    // Fallback
    const fallbackMsg = error.response?.data?.message || defaultMessage;
    toast.error(fallbackMsg);
  };
  // ------------------------------------------

  // 1. Logic fetch data (Giữ nguyên)
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // Lưu ý: Nó dùng biến 'page' của state hiện tại
      const res = await notificationService.getNotifications(page, pageSize);
      if (res.data) {
        setNotifications(res.data.items);
        setTotal(res.data.total);
      }
    } catch (error: any) {
      handleApiError(error, "Không thể tải danh sách thông báo.");
    } finally {
      setLoading(false);
    }
  };

  // 2. --- THÊM HÀM NÀY: Xử lý nút Làm mới ---
  const handleRefresh = () => {
    if (page === 1) {
      // Nếu đang ở trang 1 rồi thì gọi tải lại luôn
      fetchNotifications();
    } else {
      // Nếu đang ở trang khác (2, 3...) thì set về 1
      // useEffect ở dưới sẽ tự động bắt sự kiện page thay đổi và gọi fetchNotifications
      setPage(1);
    }
  };

  // useEffect bắt sự kiện thay đổi trang (Giữ nguyên)
  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleItemClick = (item: INotifItem) => {
    const { type, payload } = item;

    switch (type) {
      case "voice_purchase":
        router.push("/author/revenue");
        break;
      //  Nhắc nhở gói cước -> /profile
      case "subscription_reminder":
        router.push("/profile");
        break;

      // Follower mới -> /profile/[accountId]
      case "new_follower":
        if (payload.followerId) {
          router.push(`/profile/${payload.followerId}`);
        }
        break;

      //  Đánh giá truyện HOẶC Truyện mới -> /story/[storyId]
      case "story_rating":
      case "new_story":
        if (payload.storyId) {
          router.push(`/story/${payload.storyId}`);
        }
        break;

      //  Bình luận chương HOẶC Chương mới -> /reader/[storyId]/[chapterId]
      case "chapter_comment":
      case "new_chapter":
        if (payload.storyId && payload.chapterId) {
          router.push(`/reader/${payload.storyId}/${payload.chapterId}`);
        }
        break;

      // Các trường hợp còn lại: Không làm gì (break)
      default:
        break;
    }
  };
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen py-8 px-4 bg-background">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="shadow-md border-t-4 border-t-blue-600">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Bell className="h-6 w-6 text-blue-600" />
                Thông báo
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Cập nhật tin tức mới nhất từ hệ thống và truyện bạn theo dõi.
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-blue-600"
              onClick={handleRefresh}
            >
              {/* ^^^ Sửa onClick={fetchNotifications} thành onClick={handleRefresh} */}
              {/* Thêm hiệu ứng xoay icon khi đang loading cho xịn */}
              <CheckCheck
                className={cn("mr-2 h-4 w-4", loading && "animate-spin")}
              />
              Làm mới
            </Button>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
              </div>
            ) : notifications.length > 0 ? (
              <div className="flex flex-col">
                {notifications.map((item) => (
                  <NotificationRow
                    key={item.notificationId}
                    item={item}
                    onClick={handleItemClick}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-muted/10">
                <Bell className="h-12 w-12 mb-4 opacity-20" />
                <p>Bạn chưa có thông báo nào.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* --- PHÂN TRANG --- */}
        {!loading && total > 0 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page > 1) setPage((p) => p - 1);
                  }}
                  className={
                    page <= 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              <PaginationItem>
                <span className="px-4 text-sm font-medium text-muted-foreground">
                  Trang{" "}
                  <span className="text-foreground font-bold">{page}</span> /{" "}
                  {totalPages || 1}
                </span>
              </PaginationItem>

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page < totalPages) setPage((p) => p + 1);
                  }}
                  className={
                    page >= totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
}
