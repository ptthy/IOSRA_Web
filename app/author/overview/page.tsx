//app/author/overview/page.tsx
/* 
MỤC ĐÍCH: Trang dashboard chính của tác giả - quản lý trạng thái truyện
CHỨC NĂNG CHÍNH:
- Tổng quan tất cả truyện của tác giả theo trạng thái (draft, pending, published, rejected, completed)
- Hiển thị truyện đang viết (chỉ 1 được phép viết cùng lúc theo quy định ToraNovel)
- Phân loại và hiển thị truyện theo từng trạng thái riêng biệt
- Button điều hướng thông minh tùy theo trạng thái truyện (ví dụ: "Gửi AI Chấm Điểm" cho draft, "Quản lý Chương" cho published)
- Thông báo quy định chỉ được viết 1 truyện cùng lúc
- Kiểm tra quyền author trước khi hiển thị nội dung (nếu không phải author thì redirect đến trang nâng cấp)
ĐỐI TƯỢNG SỬ DỤNG: Tác giả (Author) đã được xác thực và approved
FLOW XỬ LÝ CHÍNH:
1. Kiểm tra quyền author → nếu không có quyền → redirect
2. Load danh sách truyện từ API
3. Phân loại truyện theo trạng thái
4. Xác định truyện "active" (đang viết)
5. Hiển thị UI tương ứng với trạng thái hiện tại
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
import {
  Loader2,
  Plus,
  BookOpen,
  AlertCircle,
  FileText,
  Eye,
} from "lucide-react";
import { storyService } from "@/services/storyService";
import type { Story, Tag } from "@/services/apiTypes";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import React from "react";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
export default function AuthorDashboardPage() {
  /**
   * HOOKS VÀ STATE CƠ BẢN:
   * - useRouter: Để điều hướng giữa các trang trong ứng dụng Next.js
   * - useAuth: Lấy thông tin user và kiểm tra quyền author từ AuthContext
   * - stories: State lưu danh sách truyện của tác giả (kiểu Story[])
   * - isLoading: State quản lý trạng thái loading khi fetch data từ API
   */
  const router = useRouter();

  const { user, isAuthor } = useAuth(); // Lấy thông tin user và flag isAuthor từ context
  const [stories, setStories] = useState<Story[]>([]); // State lưu danh sách truyện
  const [isLoading, setIsLoading] = useState(true); // State quản lý loading
  /**
   * HELPER XỬ LÝ LỖI API THỐNG NHẤT:
   * @param error - Error object từ API call (Axios error structure)
   * @param defaultMessage - Message mặc định nếu không có thông tin lỗi từ backend
   *
   * LOGIC XỬ LÝ LỖI THEO THỨ TỰ ƯU TIÊN:
   * 1. Ưu tiên lấy lỗi validation chi tiết từ backend (details) - thường dùng cho form validation
   * 2. Sau đó lấy message lỗi chung từ error.response.data.error.message
   * 3. Cuối cùng dùng defaultMessage nếu không có thông tin gì
   *
   * CẤU TRÚC ERROR TỪ BACKEND (Axios response):
   * - error.response.data.error.message: Message lỗi chính
   * - error.response.data.error.details: Chi tiết validation (object với key là field name, value là array lỗi)
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

  /**
   * EFFECT KIỂM TRA QUYỀN VÀ LOAD DATA KHI USER THAY ĐỔI:
   * Chạy mỗi khi user hoặc router thay đổi (dependency array [user, router])
   *
   * LOGIC KIỂM TRA QUYỀN:
   * 1. Nếu không có user -> đang loading, không làm gì (chờ auth context)
   * 2. Nếu user không có quyền author (dựa trên roles hoặc isAuthorApproved) -> redirect đến trang nâng cấp
   * 3. Nếu user có quyền author -> load danh sách truyện
   *
   * LƯU Ý: Dùng dependency [user, router] để chạy lại khi user thay đổi (login/logout)
   *        ESLint disable cho dependency array vì loadStories cần thêm dependencies
   */
  useEffect(() => {
    // Nếu không có user, không làm gì (đang loading từ auth context)
    if (!user) return;

    // Kiểm tra quyền author dựa trên roles hoặc isAuthorApproved
    // Có thể dùng flag isAuthor từ context hoặc tự check
    const isUserAuthor =
      user.roles?.includes("author") || user.isAuthorApproved;

    if (!isUserAuthor) {
      // Nếu không phải author, redirect về trang nâng cấp với message
      router.push(
        "/author-upgrade?message=Bạn cần nâng cấp tài khoản để truy cập trang này."
      );
      return;
    }

    // Nếu đã là author, load stories
    loadStories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router]);
  /**
   * HÀM LOAD DANH SÁCH TRUYỆN TỪ API:
   * 1. Set loading state = true để hiển thị spinner
   * 2. Gọi API getAllStories từ storyService (lấy tất cả truyện của user)
   * 3. Set data vào state stories nếu thành công
   * 4. Xử lý lỗi bằng helper handleApiError
   * 5. Luôn tắt loading state ở finally (dù thành công hay thất bại)
   */
  const loadStories = async () => {
    setIsLoading(true);
    try {
      // Gọi getAllStories không có tham số (hoặc chỉ với status nếu cần)
      const data = await storyService.getAllStories();
      setStories(data); // Lưu data vào state
    } catch (error: any) {
      console.error("Error loading stories:", error);
      // --- DÙNG HELPER ---
      handleApiError(error, "Không thể tải danh sách truyện.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * HÀM ĐIỀU HƯỚNG THÔNG MINH (DYNAMIC ROUTING):
   * @param page - Tên trang đích (key trong routes object)
   * @param params - Tham số cho route (ví dụ: storyId cho dynamic routes)
   *
   * LOGIC: Sử dụng mapping object để chuyển tên trang thành URL thực
   * ƯU ĐIỂM:
   * - Dễ quản lý route tập trung một chỗ
   * - Có thể thêm params động (như storyId) cho dynamic routes
   * - Dễ maintain, thay đổi URL chỉ cần sửa object routes
   */
  const onNavigate = (page: string, params?: any) => {
    // Object mapping page name -> actual route
    const routes: Record<string, string> = {
      "author-dashboard": "/author/overview",
      "author-create-story": "/author/create-story",
      "submit-ai": params?.storyId
        ? `/author/story/${params.storyId}/submit-ai`
        : "/author/overview",
      "ai-result": params?.storyId
        ? `/author/story/${params.storyId}/ai-result`
        : "/author/overview",
      "manage-chapters": params?.storyId
        ? `/author/story/${params.storyId}/chapters`
        : "/author/overview",
      "story-detail": `/author/story/${params?.storyId}`,
    };
    // Lấy route từ mapping hoặc fallback về /page
    const route = routes[page] || `/${page}`;
    router.push(route); // Điều hướng
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
   * - activeStory: Truyện đầu tiên tìm thấy ở trạng thái có thể tiếp tục viết (draft, pending, published)
   * - hasActiveStory: Boolean kiểm tra có truyện active không
   *
   * QUY ĐỊNH TORANOVEL: Chỉ được viết 1 truyện cùng lúc
   * Truyện "active" là truyện chưa hoàn thành, chưa bị từ chối
   */
  const activeStory = stories.find(
    (s) =>
      s.status === "draft" || s.status === "pending" || s.status === "published"
  );
  const hasActiveStory = !!activeStory; // Convert sang boolean

  /**
   * HELPER HIỂN THỊ BADGE TRẠNG THÁI TRUYỆN:
   * @param status - Trạng thái của truyện (type: Story["status"])
   * @returns Component Badge với màu sắc và text phù hợp
   *
   * MAPPING TRẠNG THÁI -> UI:
   * - draft: Bản nháp (màu secondary - xám)
   * - pending: Chờ duyệt (màu xanh dương)
   * - published: Đã xuất bản (màu xanh lá)
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
      case "rejected":
        return <Badge variant="destructive">Bị từ chối</Badge>;
      case "completed":
        return <Badge variant="outline">Hoàn thành</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>; // Fallback cho status không xác định
    }
  };

  /**
   * HELPER HIỂN THỊ TEXT NÚT QUẢN LÝ THEO TRẠNG THÁI:
   * @param status - Trạng thái của truyện
   * @returns Text phù hợp với hành động có thể thực hiện
   *
   * LOGIC MAPPING TRẠNG THÁI -> HÀNH ĐỘNG:
   * - draft: "Gửi AI Chấm Điểm" (chuyển từ draft sang pending)
   * - pending/rejected: "Xem Kết Quả" (xem feedback từ AI/Moderator)
   * - published: "Quản lý Chương" (vào trang quản lý chapters)
   */
  const getManageButtonText = (status: Story["status"]) => {
    switch (status) {
      case "draft":
        return "Gửi AI Chấm Điểm";
      case "pending":
      case "rejected":
        return "Xem Kết Quả";
      case "published":
        return "Quản lý Chương";
      default:
        return "Quản lý"; // Fallback
    }
  };

  /**
   * HELPER XÁC ĐỊNH ROUTE QUẢN LÝ THEO TRẠNG THÁI:
   * @param status - Trạng thái truyện
   * @param storyId - ID của truyện
   * @returns Object chứa page và params để điều hướng
   *
   * LOGIC ĐIỀU HƯỚNG THÔNG MINH:
   * - draft: Đến trang submit-ai để gửi chấm điểm AI
   * - pending/rejected: Đến trang chi tiết truyện (story-detail) để xem kết quả
   * - published: Đến trang quản lý chương (manage-chapters)
   */
  const getManageRoute = (status: Story["status"], storyId: string) => {
    switch (status) {
      case "draft":
        return { page: "submit-ai", params: { storyId } };
      case "pending":
      case "rejected":
        return { page: "story-detail", params: { storyId } };
      case "published":
        return { page: "manage-chapters", params: { storyId } };
      default:
        return { page: "author-dashboard", params: undefined }; // Fallback về dashboard
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header của trang */}
      <div>
        <h2 className="text-3xl font-bold text-[var(--primary)]">
          Trạng Thái Truyện
        </h2>
        <p className="text-sm text-muted-foreground">
          Quản lý và theo dõi tác phẩm của bạn
        </p>
      </div>

      {/* 
        TRẠNG THÁI A: CHƯA CÓ TRUYỆN ACTIVE HOẶC ĐÃ HOÀN THÀNH
        Hiển thị khi tác giả chưa có truyện nào đang viết (draft/pending/published)
        Cho phép tạo truyện mới
      */}
      {!hasActiveStory && (
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
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                Bạn chưa có truyện nào đang viết
              </p>
              <Button
                className="h-12 px-10 text-base font-medium min-w-[220px]
    border-2 border-[#F0EAD6] 
    text-[#00416A] dark:text-[#F0EAD6]
    dark:border-[#F0EAD6]"
                variant="outline"
                onClick={() => onNavigate("author-create-story")}
              >
                Bắt đầu sáng tác
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 
        TRẠNG THÁI B: ĐÃ CÓ 1 TRUYỆN ĐANG VIẾT (ACTIVE)
        Hiển thị khi tác giả đang có truyện active
        Hiển thị cảnh báo quy định và thông tin truyện đang viết
      */}
      {hasActiveStory && (
        <>
          {/* Alert về giới hạn 1 truyện */}
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
                Theo quy định của ToraNovel, bạn chỉ có thể tạo truyện mới sau
                khi hoàn thành tác phẩm hiện tại.
              </div>
            </AlertDescription>
          </Alert>

          {/* Card hiển thị truyện đang viết */}
          <Card>
            <CardHeader>
              <CardTitle>Truyện đang viết</CardTitle>
              <CardDescription>
                Quản lý và cập nhật tiến độ tác phẩm của bạn
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <div className="flex items-start gap-4 p-4">
                  {/* Cover Image */}
                  <div className="shrink-0">
                    <ImageWithFallback
                      src={activeStory.coverUrl}
                      alt={activeStory.title}
                      className="w-20 h-28 sm:w-24 sm:h-32 object-cover rounded-lg shadow-md"
                      style={{
                        backgroundColor: !activeStory.coverUrl
                          ? "#f1f5f9"
                          : "transparent",
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Title & Description */}
                    <div>
                      <h3 className="font-semibold text-lg mb-1">
                        {activeStory.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {activeStory.description}
                      </p>
                    </div>

                    {/* 
                      GRID METADATA: 3 cột trên desktop, 1 cột trên mobile
                      Hiển thị: Thể loại, Trạng thái, Ngày cập nhật
                    */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                      {/* Thể loại (tags) */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Thể loại
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {activeStory.tags && activeStory.tags.length > 0 ? (
                            // Map qua tags và hiển thị badge cho mỗi tag
                            activeStory.tags.map((tag: Tag) => (
                              <Badge key={tag.tagId} variant="secondary">
                                {tag.tagName}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              -
                            </span> // Fallback nếu không có tag
                          )}
                        </div>
                      </div>
                      {/* Trạng thái */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Trạng thái
                        </p>
                        {getStatusBadge(activeStory.status)}
                      </div>
                      {/* Ngày cập nhật */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Cập nhật
                        </p>
                        <p className="text-sm">
                          {new Date(activeStory.updatedAt).toLocaleDateString(
                            "vi-VN"
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons - responsive: column trên mobile, row trên desktop */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      {/* Nút Xem Chi Tiết */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          onNavigate("story-detail", {
                            storyId: activeStory.storyId,
                          })
                        }
                        className="w-full sm:w-auto"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Xem Chi Tiết
                      </Button>
                      {/* 
                        Nút Quản Lý - hành động thay đổi theo trạng thái
                        Sử dụng getManageRoute để xác định route điều hướng
                      */}
                      <Button
                        size="sm"
                        onClick={() => {
                          const route = getManageRoute(
                            activeStory.status,
                            activeStory.storyId
                          );
                          onNavigate(route.page, route.params);
                        }}
                        className="w-full sm:w-auto"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        {getManageButtonText(activeStory.status)}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* 
        DANH SÁCH TRUYỆN ĐÃ BỊ TỪ CHỐI
        Chỉ hiển thị khi có ít nhất 1 truyện rejected
        Hiển thị trong card với border màu đỏ (destructive)
      */}
      {stories.filter((s) => s.status === "rejected").length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">
              Truyện đã bị từ chối
            </CardTitle>
            <CardDescription>
              Các tác phẩm không đạt yêu cầu của AI ToraNovel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Filter và map qua các truyện rejected */}
              {stories
                .filter((s) => s.status === "rejected")
                .map((story) => (
                  <div
                    key={story.storyId}
                    className="border border-destructive/30 rounded-lg overflow-hidden bg-red-50/50 dark:bg-red-950/10"
                  >
                    <div className="flex items-start gap-4 p-4">
                      {/* Cover Image */}
                      <div className="shrink-0">
                        <ImageWithFallback
                          src={story.coverUrl}
                          alt={story.title}
                          className="w-16 h-24 sm:w-20 sm:h-28 object-cover rounded-lg shadow-md"
                          style={{
                            backgroundColor: !story.coverUrl
                              ? "#f1f5f9"
                              : "transparent",
                          }}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <h3 className="font-semibold">{story.title}</h3>
                        <div className="flex flex-wrap items-center gap-2">
                          {story.tags && story.tags.length > 0
                            ? story.tags.map((tag: Tag) => (
                                <Badge key={tag.tagId} variant="secondary">
                                  {tag.tagName}
                                </Badge>
                              ))
                            : null}
                          {getStatusBadge(story.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Từ chối:{" "}
                          {new Date(story.updatedAt).toLocaleDateString(
                            "vi-VN"
                          )}
                        </p>
                        {/* Hiển thị điểm AI nếu có (chỉ cho rejected) */}
                        {story.aiScore !== undefined && (
                          <p className="text-sm text-destructive">
                            Điểm AI: {story.aiScore.toFixed(2)}
                          </p>
                        )}
                        {/* Nút Xem Kết Quả */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            onNavigate("story-detail", {
                              storyId: story.storyId,
                            })
                          }
                          className="w-full sm:w-auto"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Xem Kết Quả
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 
        DANH SÁCH TRUYỆN ĐÃ HOÀN THÀNH
        Chỉ hiển thị khi có ít nhất 1 truyện completed
      */}
      {stories.filter((s) => s.status === "completed").length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Truyện đã hoàn thành</CardTitle>
            <CardDescription>Các tác phẩm đã hoàn tất của bạn</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Filter và map qua các truyện completed */}
              {stories
                .filter((s) => s.status === "completed")
                .map((story) => (
                  <div
                    key={story.storyId}
                    className="border rounded-lg overflow-hidden"
                  >
                    <div className="flex items-start gap-4 p-4">
                      {/* Cover Image */}
                      <div className="shrink-0">
                        <ImageWithFallback
                          src={story.coverUrl}
                          alt={story.title}
                          className="w-16 h-24 sm:w-20 sm:h-28 object-cover rounded-lg shadow-md"
                          style={{
                            backgroundColor: !story.coverUrl
                              ? "#f1f5f9"
                              : "transparent",
                          }}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <h3 className="font-semibold">{story.title}</h3>
                        <div className="flex flex-wrap items-center gap-2">
                          {story.tags && story.tags.length > 0
                            ? story.tags.map((tag: Tag) => (
                                <Badge key={tag.tagId} variant="secondary">
                                  {tag.tagName}
                                </Badge>
                              ))
                            : null}
                          {getStatusBadge(story.status)}
                        </div>
                        {/* Ngày hoàn thành */}
                        <p className="text-sm text-muted-foreground">
                          Hoàn thành:{" "}
                          {new Date(story.updatedAt).toLocaleDateString(
                            "vi-VN"
                          )}
                        </p>
                        {/* Nút Xem Chi Tiết */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            onNavigate("story-detail", {
                              storyId: story.storyId,
                            })
                          }
                          className="w-full sm:w-auto"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Xem Kết Quả
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
