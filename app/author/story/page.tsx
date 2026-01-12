//app/author/story/page.tsx

/*
MỤC ĐÍCH: Trang quản lý tất cả truyện của tác giả (danh sách tổng hợp)
CHỨC NĂNG CHÍNH:
1. Hiển thị danh sách tất cả truyện do tác giả sở hữu và quản lý
2. Hiển thị trạng thái từng truyện (draft, pending, published, hidden, rejected, completed)
3. Hiển thị cảnh báo nếu tác giả đang có truyện "active" (theo quy định chỉ được viết 1 truyện tại 1 thời điểm)
4. Cho phép tạo truyện mới nếu chưa có truyện nào đang viết (active)
5. Điều hướng đến trang chi tiết truyện, tạo truyện mới hoặc dashboard
6. Tự động tải danh sách truyện khi trang được mở
KHÁC BIỆT SO VỚI DASHBOARD (/author/overview):
- Dashboard: Tập trung vào trạng thái hiện tại và phân loại theo nhóm
- Manage Stories: Hiển thị tất cả truyện trong 1 danh sách, không phân nhóm
ĐỐI TƯỢNG SỬ DỤNG: Tác giả (Author) muốn xem tổng quan tất cả truyện của mình
FLOW XỬ LÝ CHÍNH:
1. Load danh sách truyện từ API
2. Xác định có truyện "active" không (draft/pending/published/hidden)
3. Hiển thị UI tương ứng: cho phép tạo mới nếu không có active, cảnh báo nếu có
4. Hiển thị danh sách tất cả truyện với thông tin cơ bản
*/
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, BookOpen, Eye } from "lucide-react";
import { storyService } from "@/services/storyService";
import type { Story } from "@/services/apiTypes";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function ManageStoriesPage() {
  /**
   * HOOKS VÀ STATE:
   * - useRouter: Để điều hướng giữa các trang
   * - stories: State lưu danh sách tất cả truyện của tác giả
   * - isLoading: State quản lý loading khi fetch data
   */
  const router = useRouter();
  // State quản lý danh sách truyện và loading
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * HELPER XỬ LÝ LỖI API THỐNG NHẤT (giống các file khác):
   * Xử lý error response từ backend với ưu tiên: details -> message -> fallback
   * Đảm bảo consistency trong error handling toàn bộ app
   */
  const handleApiError = (error: any, defaultMessage: string) => {
    // 1. Check lỗi Validation/Logic từ Backend
    if (error.response && error.response.data && error.response.data.error) {
      const { message, details } = error.response.data.error;

      // Ưu tiên Validation (details)
      if (details) {
        const firstKey = Object.keys(details)[0];
        if (firstKey && details[firstKey].length > 0) {
          // Nối các lỗi lại thành 1 câu
          const msg = details[firstKey].join(" ");
          toast.error(msg);
          return;
        }
      }

      // Message từ Backend
      if (message) {
        toast.error(message);
        return;
      }
    }

    // 2. Fallback
    const fallbackMsg = error.response?.data?.message || defaultMessage;
    toast.error(fallbackMsg);
  };
  // -------------------

  /**
   * useEffect ĐỂ LOAD DANH SÁCH TRUYỆN KHI COMPONENT MOUNT:
   * Chạy 1 lần khi component được mount lần đầu tiên
   * Dependency array rỗng [] -> chỉ chạy 1 lần
   */
  useEffect(() => {
    loadStories();
  }, []);
  /**
   * HÀM LOAD DANH SÁCH TRUYỆN TỪ API:
   * 1. Set loading state = true để hiển thị spinner
   * 2. Gọi API getAllStories từ storyService
   * 3. Set data vào state stories nếu thành công
   * 4. Xử lý lỗi bằng helper handleApiError
   * 5. Luôn tắt loading state ở finally
   */
  const loadStories = async () => {
    setIsLoading(true);
    try {
      // Gọi API để lấy tất cả truyện của user
      const data = await storyService.getAllStories();
      setStories(data);
    } catch (error: any) {
      // --- DÙNG HELPER ---
      handleApiError(error, "Không thể tải danh sách truyện.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * HELPER FUNCTION ĐỂ NAVIGATE ĐẾN CÁC TRANG KHÁC:
   * @param page - Tên trang đích (key trong routes object)
   * @param params - Tham số cho route (ví dụ: storyId cho dynamic routes)
   *
   * Tương tự như trong dashboard page, dùng mapping object để quản lý route tập trung
   */
  const onNavigate = (page: string, params?: any) => {
    const routes: Record<string, string> = {
      "author-dashboard": "/author/overview",
      "author-create-story": "/author/create-story",
      "story-detail": `/author/story/${params?.storyId}`,
    };

    const route = routes[page] || `/${page}`;
    router.push(route);
  };

  // Hiển thị loading spinner khi đang fetch data
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  /**
   * LOGIC XÁC ĐỊNH TRUYỆN "ACTIVE" (ĐANG VIẾT):
   * - activeStory: Truyện đầu tiên tìm thấy ở trạng thái active
   * - hasActiveStory: Boolean kiểm tra có truyện active không
   *
   * ĐỊNH NGHĨA "ACTIVE STORY" TRONG TRANG NÀY:
   * - Bao gồm: draft, pending, published, hidden
   * - Không bao gồm: rejected, completed (đã kết thúc)
   *
   * QUY ĐỊNH TORANOVEL: Chỉ được viết 1 truyện cùng lúc
   */
  const activeStory = stories.find(
    (s) =>
      s.status === "draft" ||
      s.status === "pending" ||
      s.status === "published" ||
      s.status === "hidden"
  );
  const hasActiveStory = !!activeStory;

  /**
   * HÀM TRẢ VỀ BADGE CHO TỪNG TRẠNG THÁI TRUYỆN:
   * @param status - Trạng thái của truyện (type: Story["status"])
   * @returns Component Badge với màu sắc và text phù hợp
   *
   * MAPPING TRẠNG THÁI -> UI (tương tự dashboard nhưng có thêm "hidden"):
   * - draft: Bản nháp (màu secondary - xám)
   * - pending: Chờ duyệt (màu xanh dương)
   * - published: Đã xuất bản (màu xanh lá)
   * - hidden: Đã ẩn (màu amber/vàng cam) - truyện đã published nhưng tác giả ẩn đi
   * - rejected: Bị từ chối (màu đỏ - variant destructive)
   * - completed: Hoàn thành (outline - viền)
   */
  const getStatusBadge = (status: Story["status"]) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Bản nháp</Badge>;
      case "pending":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300">
            Chờ duyệt
          </Badge>
        );
      case "published":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300">
            Đã xuất bản
          </Badge>
        );
      case "hidden":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800">
            Đã ẩn
          </Badge>
        );
      case "rejected":
        return <Badge variant="destructive">Bị từ chối</Badge>;
      case "completed":
        return <Badge variant="outline">Hoàn thành</Badge>;

      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header của trang */}
      <div>
        <h2 className="text-3xl font-bold text-[var(--primary)]">
          Quản Lý Truyện
        </h2>
        <p className="text-sm text-muted-foreground">
          Danh sách tất cả các truyện của bạn
        </p>
      </div>

      {/* 
        Alert về giới hạn 1 truyện - chỉ hiển thị khi có truyện active
        Tương tự như dashboard nhưng hiển thị ở đây để nhắc nhở user
      */}
      {hasActiveStory && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            <strong>Quy định của ToraNovel</strong>
          </AlertTitle>
          <AlertDescription>
            <div className="text-foreground">
              <span>Bạn đang sáng tác truyện: </span>
              <span className="font-bold">{activeStory?.title}</span>
            </div>
            <div className="mt-1">
              Theo quy định của ToraNovel, bạn chỉ có thể tạo truyện mới sau khi
              hoàn thành tác phẩm hiện tại.
            </div>
          </AlertDescription>
        </Alert>
      )}
      {/* Card tạo truyện mới - hiển thị khác nhau tùy vào hasActiveStory */}
      {/* Nút tạo truyện mới - chỉ enable khi không có truyện đang viết */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tạo truyện mới</CardTitle>
              <CardDescription>
                Bắt đầu viết và chia sẻ câu chuyện của bạn với độc giả
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!hasActiveStory ? (
            // Hiển thị khi KHÔNG có truyện active - cho phép tạo mới
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                Bạn chưa có truyện nào đang viết
              </p>
              <Button
                variant="outline"
                onClick={() => onNavigate("author-create-story")}
              >
                Bắt đầu sáng tác
              </Button>
            </div>
          ) : (
            // Hiển thị khi ĐÃ có truyện active - không cho phép tạo mới
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Bạn có thể tạo truyện mới sau khi hoàn thành truyện hiện tại.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      {/* 
        Danh sách tất cả truyện - Hiển thị khi có ít nhất 1 truyện
        Khác với dashboard: hiển thị tất cả trong 1 list, không phân nhóm
      */}
      {/* Danh sách truyện - Hiển thị tất cả truyện đã tạo */}
      {stories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Danh sách truyện</CardTitle>
            <CardDescription>Tất cả các truyện bạn đã tạo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Map qua tất cả stories (không filter theo status) */}
              {stories.map((story) => (
                <div
                  key={story.storyId}
                  className="border rounded-lg overflow-hidden"
                >
                  <div className="flex items-start gap-4 p-4">
                    {/* Cover Image */}
                    {/* Cover Image với fallback nếu không có ảnh */}
                    <div className="shrink-0">
                      <div className="w-16 h-24 sm:w-20 sm:h-28 bg-muted rounded-lg flex items-center justify-center">
                        {story.coverUrl ? (
                          // Hiển thị ảnh cover nếu có
                          <img
                            src={story.coverUrl}
                            alt={story.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          // Fallback icon nếu không có ảnh
                          <BookOpen className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Content bên phải ảnh */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <h3 className="font-semibold">{story.title}</h3>
                      {/* Tags và status badge */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Chỉ hiển thị tag đầu tiên (nếu có) để UI gọn */}
                        {story.tags && story.tags.length > 0 ? (
                          <Badge variant="secondary">
                            {story.tags[0].tagName}
                          </Badge>
                        ) : null}
                        {/* Badge trạng thái */}
                        {getStatusBadge(story.status)}
                      </div>
                      {/* Mô tả truyện (truncate 2 dòng) */}
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {story.description}
                      </p>
                      {/* Ngày cập nhật */}
                      <p className="text-sm text-muted-foreground">
                        Cập nhật:{" "}
                        {new Date(story.updatedAt).toLocaleDateString("vi-VN")}
                      </p>
                      {/* Nút Xem Chi Tiết - điều hướng đến trang chi tiết truyện */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          onNavigate("story-detail", { storyId: story.storyId })
                        }
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Xem Chi Tiết
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
