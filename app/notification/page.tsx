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
  Coins,
  CreditCard,
  Trophy,
  Mic,
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
import { cn } from "@/lib/utils"; // Helper để gộp và xử lý className Tailwind CSS một cách linh hoạt

/**
 * Trang danh sách thông báo của người dùng
 *
 * MỤC ĐÍCH:
 * - Hiển thị tất cả thông báo của người dùng theo thời gian
 * - Phân trang (20 items/trang)
 * - Real-time update qua event listener
 * - Xử lý click vào thông báo để điều hướng đến trang liên quan
 *
 * CÁC LOẠI THÔNG BÁO HỖ TRỢ:
 * - new_chapter: Chương mới của truyện đang theo dõi
 * - new_story: Truyện mới từ tác giả yêu thích
 * - subscription_reminder: Nhắc nhở gói cước sắp hết hạn
 * - new_follower: Người dùng mới theo dõi
 * - chapter_comment: Có bình luận mới trên chương truyện
 * - story_rating: Có đánh giá mới trên truyện
 * - op_request: Yêu cầu rút tiền (author)
 * - chapter_purchase: Chương truyện được mua
 * - author_rank_upgrade: Nâng cấp rank tác giả
 * - voice_purchase: Giọng đọc AI được mua
 *
 * LIÊN THÔNG VỚI:
 * - @/services/notificationService: Lấy danh sách thông báo
 * - Event listener "notification-updated": Real-time update
 * - Các trang khác: Điều hướng khi click thông báo
 */

/**
 * Component hiển thị một dòng thông báo
 *
 * PROPS:
 * - item: Thông tin thông báo từ API
 * - onClick: Hàm xử lý khi click vào thông báo
 *
 * TÍNH NĂNG:
 * - Icon khác nhau cho mỗi loại thông báo
 * - Highlight thông báo chưa đọc (nền xanh nhạt)
 * - Hiển thị thời gian định dạng "HH:mm - dd/MM/yyyy"
 * - Dot màu xanh cho thông báo chưa đọc
 */
// --- COMPONENT HIỂN THỊ ROW (Nội bộ cho trang này) ---
const NotificationRow = ({
  item,
  onClick,
}: {
  item: INotifItem;
  onClick: (item: INotifItem) => void;
}) => {
  /**
   * Hàm trả về icon tương ứng với loại thông báo
   *
   * LOGIC:
   * - Mỗi loại thông báo có icon và màu sắc riêng
   * - Giúp người dùng nhận diện nhanh loại thông báo
   *
   * @param type - Loại thông báo từ API
   * @returns JSX.Element icon với màu sắc phù hợp
   */
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
      case "op_request":
        return <CreditCard className="h-5 w-5 text-emerald-600" />;
      case "chapter_purchase":
        return <Coins className="h-5 w-5 text-yellow-600" />;
      case "author_rank_upgrade":
        return <Trophy className="h-5 w-5 text-pink-500" />;
      case "voice_purchase":
        return <Mic className="h-4 w-4 text-indigo-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };
  // Format thời gian: "HH:mm - dd/MM/yyyy"
  const timeDisplay = format(new Date(item.createdAt), "HH:mm - dd/MM/yyyy");

  return (
    <div
      onClick={() => onClick(item)}
      className={cn(
        "flex gap-4 p-4 border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer items-start",
        // Thông báo chưa đọc có nền xanh nhạt
        !item.isRead ? "bg-blue-50/60 dark:bg-blue-900/10" : "bg-card"
      )}
    >
      {/* Icon thông báo */}
      <div className="mt-1 shrink-0 bg-background p-2 rounded-full border shadow-sm">
        {getIcon(item.type)}
      </div>
      <div className="flex flex-col gap-1 overflow-hidden flex-1">
        <div className="flex justify-between items-start gap-2">
          <span
            className={cn(
              "text-sm font-semibold",
              // Tiêu đề thông báo chưa đọc đậm hơn
              !item.isRead ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {item.title}
          </span>
          {/* Thời gian */}
          <span className="text-xs text-muted-foreground/60 whitespace-nowrap shrink-0">
            {timeDisplay}
          </span>
        </div>
        {/* Nội dung chi tiết (giới hạn 2 dòng) */}
        <span className="text-sm text-muted-foreground line-clamp-2">
          {item.message}
        </span>
      </div>
      {/* Dot màu xanh cho thông báo chưa đọc */}
      {!item.isRead && (
        <div className="self-center shrink-0 ml-2">
          <div className="h-3 w-3 rounded-full bg-blue-500 shadow-sm animate-pulse" />
        </div>
      )}
    </div>
  );
};
// Component chính của trang thông báo
export default function NotificationPage() {
  const router = useRouter();

  // State quản lý dữ liệu và UI
  const [notifications, setNotifications] = useState<INotifItem[]>([]);
  const [loading, setLoading] = useState(true);

  // State phân trang
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20); // Cố định 20 items/trang
  const [total, setTotal] = useState(0);

  /**
   * Hàm xử lý lỗi API thống nhất
   *
   * LOGIC TƯƠNG TỰ NHƯ CÁC TRANG KHÁC:
   * 1. Ưu tiên lỗi validation (details)
   * 2. Lỗi message chung
   * 3. Fallback lỗi mạng
   */
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

  /**
   * Hàm fetch danh sách thông báo từ API
   *
   * API GỌI: GET /api/notifications?page=1&limit=20
   *
   * RESPONSE DỰ KIẾN:
   * {
   *   data: {
   *     items: INotifItem[],
   *     total: 100,
   *     page: 1,
   *     limit: 20
   *   }
   * }
   */
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

  /**
   * Hàm xử lý nút "Làm mới"
   *
   * LOGIC THÔNG MINH:
   * - Nếu đang ở trang 1 -> gọi fetch trực tiếp
   * - Nếu đang ở trang khác (2,3...) -> reset về trang 1
   * - Việc reset page sẽ kích hoạt useEffect và tự fetch
   *
   * LÝ DO: Tránh trường hợp người dùng đang xem trang 5,
   * khi refresh sẽ bị giật về trang 1 mất vị trí đang xem
   */
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

  /**
   * useEffect chính - Fetch data khi page thay đổi
   *
   * CÓ 2 CHỨC NĂNG:
   * 1. Fetch danh sách thông báo khi page thay đổi
   * 2. Lắng nghe event "notification-updated" để real-time update
   *
   * REAL-TIME UPDATE LOGIC:
   * - Backend/webhook gửi event khi có thông báo mới
   * - Frontend lắng nghe event và refresh nếu đang ở trang 1
   * - Nếu đang ở trang khác -> không refresh (tránh làm gián đoạn UX)
   */
  useEffect(() => {
    // 1. Fetch data ban đầu hoặc khi page thay đổi
    fetchNotifications();
    // 2. Xử lý real-time update
    const handleRealtimeUpdate = () => {
      // Chỉ tự động load lại nếu đang ở trang 1
      // (Để tránh người dùng đang xem trang 5 tự nhiên bị giật về trang 1 hoặc bị trôi nội dung)
      if (page === 1) {
        console.log("🔄 Page: Có tin mới -> Refresh list...");
        fetchNotifications();
      }
    };
    // Lắng nghe event từ nơi khác trong app (ví dụ: WebSocket, Polling)
    window.addEventListener("notification-updated", handleRealtimeUpdate);
    // Cleanup: Xóa event listener khi component unmount
    return () => {
      window.removeEventListener("notification-updated", handleRealtimeUpdate);
    };
    // ---------------------
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]); // Chỉ chạy lại khi page thay đổi

  /**
   * Hàm xử lý khi click vào một thông báo
   *
   * LOGIC ĐIỀU HƯỚNG:
   * - Dựa vào type của thông báo và payload
   * - Điều hướng đến trang phù hợp
   * - Thông báo sẽ được đánh dấu đã đọc ở backend (qua API riêng)
   *
   * @param item - Thông báo được click
   */
  const handleItemClick = (item: INotifItem) => {
    const { type, payload } = item;
    // Switch case điều hướng theo loại thông báo
    switch (type) {
      case "voice_purchase":
      case "op_request": // Yêu cầu rút tiền
      case "chapter_purchase": // Bán chương truyện
        router.push("/author/revenue");
        break;
      case "author_rank_upgrade":
        router.push("/author/author-upgrade-rank");
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
  // Tính tổng số trang
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
            {/* Nút làm mới */}
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-blue-600"
              onClick={handleRefresh} // Sử dụng handleRefresh thông minh
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
              // Trạng thái không có thông báo
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-muted/10">
                <Bell className="h-12 w-12 mb-4 opacity-20" />
                <p>Bạn chưa có thông báo nào.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Phân trang (chỉ hiện khi có dữ liệu) */}
        {!loading && total > 0 && (
          <Pagination>
            <PaginationContent>
              {/* Nút Previous */}
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
              {/* Hiển thị trang hiện tại / tổng số trang */}
              <PaginationItem>
                <span className="px-4 text-sm font-medium text-muted-foreground">
                  Trang{" "}
                  <span className="text-foreground font-bold">{page}</span> /{" "}
                  {totalPages || 1}
                </span>
              </PaginationItem>
              {/* Nút Next */}
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
