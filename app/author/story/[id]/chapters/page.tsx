//app/author/story/[id]/chapters/page.tsx
/**
 * TRANG QUẢN LÝ CHƯƠNG TRUYỆN (DANH SÁCH CHAPTERS)
 *
 * MỤC ĐÍCH:
 * - Hiển thị danh sách tất cả chương của một truyện
 * - Cung cấp giao diện để tác giả quản lý chương (xem, tạo mới)
 * - Cho phép hoàn thành truyện khi đã đủ điều kiện
 *
 * CHỨC NĂNG CHÍNH:
 * 1. Hiển thị thông tin chi tiết truyện (tiêu đề, thể loại, ngôn ngữ, trạng thái)
 * 2. Danh sách chương với trạng thái và hành động xem
 * 3. Nút tạo chương mới
 * 4. Tính năng hoàn thành truyện với validation:
 *    - Cần ít nhất 1 chương đã xuất bản
 *    - Truyện phải ở trạng thái đã xuất bản
 *    - Truyện chưa hoàn thành
 * 5. Kiểm tra độ dài truyện theo kế hoạch (super_short, short, novel)
 *
 * ĐẶC ĐIỂM:
 * - Sử dụng ribbon badge hiển thị trạng thái truyện
 * - Xử lý lỗi API thống nhất với helper function
 * - Navigation thông minh qua handleNavigate
 * - Giao diện responsive với card và table
 *
 * ĐỐI TƯỢNG SỬ DỤNG: Tác giả quản lý tất cả chương của một truyện
 * LIÊN KẾT VỚI FILE KHÁC:
 * - Sử dụng storyService và chapterService để gọi API
 * - Liên kết đến các trang edit/view chapter
 */
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  Plus,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  Lightbulb,
  Eye,
  Edit,
  Clock,
  Globe,
  FileText,
} from "lucide-react";
import { storyService } from "@/services/storyService";
import { chapterService } from "@/services/chapterService";
import type { Story, Chapter } from "@/services/apiTypes";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

/**
 * MAP ĐỘ DÀI TRUYỆN TỪ CODE SANG LABEL HIỂN THỊ
 *
 * MỤC ĐÍCH: Dùng cho phần hoàn thành truyện để hiển thị thông tin
 * CÁC LOẠI:
 * - super_short: Siêu ngắn (từ 1-5 chương)
 * - short: Ngắn (từ 6-20 chương)
 * - novel: Dài (trên 20 chương)
 */
const LENGTH_PLAN_MAP: Record<string, string> = {
  super_short: "Siêu ngắn (từ 1-5 chương)",
  short: "Ngắn (từ 6-20 chương)",
  novel: "Dài (trên 20 chương)",
};

/**
 * COMPONENT CHÍNH: ManageChaptersPage
 *
 * MỤC ĐÍCH: Trang quản lý tất cả chương của một truyện
 * ĐẶC ĐIỂM:
 * - Hiển thị danh sách chương
 * - Cho phép hoàn thành truyện (complete story)
 * - Có validation về số chương đã xuất bản
 */
export default function ManageChaptersPage() {
  // Lấy params từ URL
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;
  // STATE QUẢN LÝ
  const [story, setStory] = useState<Story | null>(null); // Thông tin truyện
  const [chapters, setChapters] = useState<Chapter[]>([]); // Danh sách chương
  const [isLoading, setIsLoading] = useState(true); // Đang tải dữ liệu
  const [isCompleting, setIsCompleting] = useState(false); // Đang hoàn thành truyện

  /**
   * HÀM XỬ LÝ LỖI API THỐNG NHẤT - ĐƯỢC CẢI TIẾN CHI TIẾT
   *
   * MỤC ĐÍCH: Xử lý lỗi từ API response theo nhiều cấu trúc khác nhau
   * FLOW XỬ LÝ:
   * 1. Log ra console để debug cấu trúc thực tế
   * 2. Check trường hợp JSON: { "error": { "message": "...", "details": {...} }
   * 3. Check trường hợp JSON phẳng: { "message": "..." }
   * 4. Fallback về message mặc định
   */
  const handleApiError = (error: any, defaultMessage: string) => {
    // 1. Log ra console để kiểm tra cấu trúc thực tế (nhấn F12 để xem)
    console.log("🔥 handleApiError Debug:", {
      responseData: error.response?.data,
      status: error.response?.status,
    });

    const responseData = error.response?.data;

    // 2. Check trường hợp JSON trả về có dạng: { "error": { "message": "..." } }
    // Đây là trường hợp JSON bạn cung cấp
    if (responseData?.error) {
      const { message, details } = responseData.error;

      // Ưu tiên hiển thị lỗi chi tiết (Validation) nếu có
      if (details) {
        // Lấy key đầu tiên trong object details
        const firstKey = Object.keys(details)[0];
        if (
          firstKey &&
          Array.isArray(details[firstKey]) &&
          details[firstKey].length > 0
        ) {
          toast.error(details[firstKey][0]); // Lấy lỗi đầu tiên
          return;
        }
      }

      // Hiển thị message từ object error
      if (message) {
        toast.error(message);
        return;
      }
    }

    // 3. Check trường hợp JSON trả về có dạng phẳng: { "message": "..." }
    if (responseData?.message) {
      toast.error(responseData.message);
      return;
    }

    // 4. Nếu không bắt được định dạng nào ở trên thì dùng Fallback
    toast.error(defaultMessage);
  };
  // -------------------

  /**
   * useEffect: TẢI DỮ LIỆU KHI storyId THAY ĐỔI
   *
   * MỤC ĐÍCH: Load dữ liệu truyện và chapters khi vào trang
   * LOGIC: Dùng Promise.all để tải song song → tối ưu performance
   * DEPENDENCIES: [storyId] → chạy lại khi storyId thay đổi
   */
  useEffect(() => {
    loadData();
  }, [storyId]);

  /**
   * HÀM TẢI DỮ LIỆU CHÍNH
   *
   * MỤC ĐÍCH: Tải song song thông tin truyện và danh sách chương
   * LOGIC: Promise.all để tối ưu thời gian loading
   */
  const loadData = async () => {
    setIsLoading(true);
    try {
      // Promise.all để tải song song → tối ưu performance
      const [storyData, chaptersData] = await Promise.all([
        storyService.getStoryDetails(storyId),
        chapterService.getAllChapters(storyId),
      ]);
      setStory(storyData);
      setChapters(chaptersData);
    } catch (error: any) {
      // --- DÙNG HELPER ---
      handleApiError(error, "Không thể tải thông tin");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * HÀM HOÀN THÀNH TRUYỆN - VỚI VALIDATION CHI TIẾT
   *
   * MỤC ĐÍCH: Đánh dấu truyện đã hoàn thành
   * ĐIỀU KIỆN VALIDATION:
   * 1. Có ít nhất 1 chương đã published
   * 2. Truyện chưa hoàn thành
   * 3. Truyện đã được published
   *
   * FLOW XỬ LÝ:
   * 1. Validation chi tiết các điều kiện
   * 2. Gọi API completeStory
   * 3. Reload data để cập nhật trạng thái
   * 4. Điều hướng về overview sau khi thành công
   */
  const handleCompleteStory = async () => {
    setIsCompleting(true);
    try {
      // Validation chi tiết hơn
      // Tính số chương đã xuất bản
      const publishedChapters = chapters.filter(
        (ch) => ch.status === "published"
      );

      console.log("🔍 Validation before completing story:", {
        storyStatus: story?.status,
        publishedChapters: publishedChapters.length,
        storyId: storyId,
      });

      // Kiểm tra điều kiện chi tiết
      // Điều kiện 1: Cần ít nhất 1 chương đã xuất bản
      if (publishedChapters.length < 1) {
        toast.error("❌ Cần ít nhất 1 chương đã xuất bản để hoàn thành truyện");
        setIsCompleting(false);
        return;
      }
      // Điều kiện 2: Truyện chưa hoàn thành
      if (story?.status === "completed") {
        toast.error("❌ Truyện này đã được hoàn thành rồi");
        setIsCompleting(false);
        return;
      }
      // Điều kiện 3: Truyện đã được xuất bản
      if (story?.status !== "published") {
        toast.error("❌ Chỉ có thể hoàn thành truyện đã được xuất bản");
        setIsCompleting(false);
        return;
      }

      console.log("🚀 Calling completeStory API...");
      // Gọi API hoàn thành truyện
      await storyService.completeStory(storyId);

      toast.success(
        "🎉 Đã đánh dấu truyện hoàn thành! Bạn có thể tạo truyện mới."
      );

      // Reload data để cập nhật trạng thái
      setTimeout(() => {
        loadData();
        // Điều hướng về overview sau 1 giây
        setTimeout(() => {
          router.push("/author/overview");
        }, 1000);
      }, 500);
    } catch (error: any) {
      console.error("Error in handleCompleteStory:", error);
      // --- DÙNG HELPER ---
      handleApiError(error, "Có lỗi xảy ra khi hoàn thành truyện");
      setIsCompleting(false);
    }
  };
  /**
   * HÀM ĐIỀU HƯỚNG THỐNG NHẤT
   *
   * MỤC ĐÍCH: Quản lý tất cả navigation trong trang
   * LOGIC: Dùng object mapping thay vì nhiều if-else
   * ƯU ĐIỂM: Dễ maintain, dễ thêm route mới
   */
  const handleNavigate = (page: string, navParams?: any) => {
    const routes: Record<string, string> = {
      "author-dashboard": "/author/overview",
      "author-stories": "/author/story",
      "story-detail": `/author/story/${navParams?.storyId}`,
      "outline-editor": `/author/story/${navParams?.storyId}/outline`,
      "chapter-editor": navParams?.chapterId
        ? `/author/story/${navParams?.storyId}/chapter/${navParams.chapterId}`
        : `/author/story/${navParams?.storyId}/chapter/new`,
      "chapter-read": `/author/story/${navParams?.storyId}/chapter/${navParams?.chapterId}`,
      "manage-chapters": `/author/story/${navParams?.storyId}/chapters`,
    };
    const route = routes[page] || `/${page}`;
    console.log(`🔄 Navigating to: ${route}`, { page, navParams });
    router.push(route);
  };

  /**
   * HÀM XEM CHI TIẾT CHƯƠNG
   *
   * MỤC ĐÍCH: Điều hướng đến trang xem chương (view mode)
   */
  const handleViewChapter = (chapterId: string) => {
    console.log("👁️ Viewing chapter:", { storyId, chapterId });
    router.push(`/author/story/${storyId}/chapter/${chapterId}`);
  };

  /**
   * HÀM CHỈNH SỬA CHƯƠNG
   *
   * MỤC ĐÍCH: Điều hướng đến trang edit chương (edit mode)
   */
  const handleEditChapter = (chapterId: string) => {
    console.log("✏️ Editing chapter:", { storyId, chapterId });
    router.push(`/author/story/${storyId}/chapter/${chapterId}/edit`);
  };

  /**
   * HIỂN THỊ LOADING SPINNER KHI ĐANG TẢI DỮ LIỆU
   */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  /**
   * HIỂN THỊ THÔNG BÁO NẾU KHÔNG TÌM THẤY TRUYỆN
   */
  if (!story) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground mb-4">Không tìm thấy truyện</p>
        <Button onClick={() => router.push("/author/overview")}>
          Quay lại Dashboard
        </Button>
      </div>
    );
  }

  /**
   * TÍNH TOÁN CÁC BIẾN CHO HIỂN THỊ VÀ VALIDATION
   *
   * - isCompleted: Truyện đã hoàn thành chưa
   * - publishedChapters: Số chương đã xuất bản
   * - canCompleteStory: Có thể hoàn thành truyện không (validation)
   */
  const isCompleted = story.status === "completed";
  const publishedChapters = chapters.filter((ch) => ch.status === "published");
  const canCompleteStory = publishedChapters.length >= 1;
  // RENDER GIAO DIỆN CHÍNH
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      {/* 1. Header Trang */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl mb-2 font-bold tracking-tight">
            Quản lý Chương
          </h1>
          <p className="text-sm text-muted-foreground">
            Truyện: <strong className="text-foreground">{story.title}</strong>
          </p>
        </div>
      </div>

      {/* 2. STORY INFO CARD (Giao diện mới với ribbon) */}
      <Card className="relative overflow-hidden shadow-sm">
        {/* Header Card: Chỉnh pb-0 để đường kẻ dính sát lên */}
        <CardHeader className="pt-2 pb-0">
          <CardTitle className="text-xl leading-none">
            Thông tin truyện
          </CardTitle>

          {/* === PHẦN RUY BĂNG (LÁ CỜ) === */}
          {(() => {
            // Cấu hình mặc định
            let statusConfig = {
              label: "Bản nháp",
              bgColor: "bg-slate-500",
              Icon: FileText,
            };

            // Logic đổi màu theo trạng thái story
            if (story.status === "published") {
              statusConfig = {
                label: "Đã xuất bản",
                bgColor: "bg-emerald-600", // Màu xanh Emerald đậm
                Icon: Globe,
              };
            } else if (story.status === "completed") {
              statusConfig = {
                label: "Đã hoàn thành",
                bgColor: "bg-purple-600",
                Icon: CheckCircle,
              };
            }

            return (
              <div className="absolute top-0 right-8 drop-shadow-md z-10">
                <div
                  className={`
                    relative px-3 pt-3 pb-5 flex flex-col items-center justify-center gap-1 
                    text-white font-bold text-xs shadow-lg transition-all
                    ${statusConfig.bgColor}
                  `}
                  // Cắt hình đuôi cá
                  style={{
                    clipPath:
                      "polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)",
                    minWidth: "70px",
                  }}
                >
                  <statusConfig.Icon className="h-5 w-5 mb-0.5" />
                  <span className="text-center leading-tight uppercase tracking-wider text-[10px]">
                    {statusConfig.label}
                  </span>
                </div>
              </div>
            );
          })()}
        </CardHeader>

        {/* Đường phân cách: Đổi màu theo Theme & Sát lên trên */}
        <div className="w-full h-[1px]  bg-[#00416a] dark:bg-[#f0ead6] mt-0" />

        {/* Nội dung Card */}
        <CardContent className="space-y-4 pt-4">
          {" "}
          {/* Tăng pt-4 để cân đối hơn */}
          <div className="grid md:grid-cols-3 gap-6">
            {" "}
            {/* Cột 1: Tên truyện */}
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Tên truyện</p>
              <p className="font-semibold text-lg text-primary">
                {story.title}
              </p>
            </div>
            {/* Cột 2: Thể loại  */}
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Thể loại</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {story.tags?.map((tag) => (
                  <Badge
                    key={tag.tagId}
                    variant="secondary"
                    className="px-2 py-1 font-normal"
                  >
                    {tag.tagName}
                  </Badge>
                ))}
              </div>
            </div>
            {/* Cột 3: Ngôn ngữ & Mã Code */}
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Ngôn ngữ</p>
              <div className="flex items-center gap-2 pt-1">
                <Badge
                  variant="outline"
                  className="font-medium bg-primary/5 border-primary/20"
                >
                  {story.languageCode === "vi-VN" && "Tiếng Việt"}
                  {story.languageCode === "en-US" && "English"}
                  {story.languageCode === "zh-CN" && "中文 (Chinese)"}
                  {story.languageCode === "ja-JP" && "日本語 (Japanese)"}
                  {!["vi-VN", "en-US", "zh-CN", "ja-JP"].includes(
                    story.languageCode
                  ) && story.languageCode}
                </Badge>
                <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                  {story.languageCode}
                </span>
              </div>
            </div>
            {/* Cột phải (Mô tả) - Chiếm hết 3 cột ở hàng dưới */}
            <div className="md:col-span-3 pt-2 border-t border-dashed">
              <p className="text-sm text-muted-foreground mb-1">Mô tả</p>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {story.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Nút Dàn Ý Truyện */}
        <Button
          variant="outline"
          className="h-auto py-4 flex-col items-start gap-2"
          onClick={() => handleNavigate("outline-editor", { storyId: storyId })}
        >
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <span className="font-semibold">Dàn Ý Truyện</span>
          </div>
          <span className="text-xs text-muted-foreground text-left">
            Quản lý dàn ý và outline giúp viết truyện mạch lạc
          </span>
        </Button>
        {/* Nút Đăng Chương Mới */}
        <Button
          className="h-auto py-4 flex-col items-start gap-2"
          onClick={() => handleNavigate("chapter-editor", { storyId })}
        >
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            <span className="font-semibold">Đăng Chương Mới</span>
          </div>
          <span className="text-xs opacity-90 text-left">
            Viết và gửi chương mới cho ContentMod duyệt
          </span>
        </Button>
      </div>

      {/* Chapters List - Table hiển thị danh sách chương */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Danh sách Chương</CardTitle>
              <CardDescription>
                Chương sẽ được gửi cho ContentMod duyệt trước khi xuất bản
              </CardDescription>
            </div>
            <Button
              onClick={() => handleNavigate("chapter-editor", { storyId })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Đăng Chương Mới
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {chapters.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                Chưa có chương nào được đăng
              </p>
            </div>
          ) : (
            // Table hiển thị danh sách chương
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-base">STT</TableHead>
                  <TableHead className="text-base">Tên chương</TableHead>
                  <TableHead className="text-base">Ngày đăng</TableHead>
                  <TableHead className="text-base">Trạng thái</TableHead>
                  <TableHead className="text-base text-right">
                    Hành động
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chapters.map((chapter, index) => (
                  <TableRow key={chapter.chapterId}>
                    <TableCell className="text-base">{index + 1}</TableCell>
                    <TableCell className="text-base">{chapter.title}</TableCell>
                    <TableCell className="text-base text-muted-foreground">
                      {chapter.publishedAt
                        ? new Date(chapter.publishedAt).toLocaleDateString(
                            "vi-VN"
                          )
                        : "Chưa xuất bản"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          chapter.status === "published"
                            ? "default"
                            : chapter.status === "pending"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {chapter.status === "published"
                          ? "Đã xuất bản"
                          : chapter.status === "pending"
                          ? "Chờ duyệt"
                          : "Chưa xuất bản"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewChapter(chapter.chapterId)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Xem
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Complete Story Section */}
      <Card className="border-destructive/30">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1">
              <CardTitle>Hoàn thành Truyện</CardTitle>
              <CardDescription className="mt-2">
                {canCompleteStory
                  ? "Chỉ sử dụng khi truyện đã hoàn tất tất cả các chương. Hành động này sẽ cho phép bạn tạo truyện mới."
                  : `Cần ít nhất 1 chương đã xuất bản để hoàn thành truyện. Hiện có ${publishedChapters.length} chương đã xuất bản.`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        {/* --- SỬA NỘI DUNG CARD CONTENT TẠI ĐÂY --- */}
        <CardContent className="space-y-4">
          {/* 1. Cảnh báo quan trọng (Đã sửa nội dung quy định) */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                <strong>Lưu ý quan trọng:</strong> Sau khi đánh dấu hoàn thành,
                bạn sẽ không thể cập nhật thêm nội dung cho truyện này.
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-2">
                <strong>Quy định:</strong> Bạn cần đảm bảo truyện đã đạt{" "}
                <strong>đủ số lượng chương</strong> tương ứng với kế hoạch độ
                dài đã đăng ký bên dưới.
              </p>
            </div>
          </div>

          {/* 2. Hiển thị độ dài dự kiến & So sánh số chương hiện tại */}
          {/* Dùng (story as any) để tránh lỗi nếu typescript chưa cập nhật type */}
          {(story as any)?.length_plan &&
            LENGTH_PLAN_MAP[(story as any).length_plan] && (
              <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 rounded-lg">
                <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-purple-800 dark:text-purple-300 font-medium">
                    Kế hoạch độ dài:{" "}
                    {LENGTH_PLAN_MAP[(story as any).length_plan]}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-purple-700 dark:text-purple-400">
                      Hiện có: <strong>{publishedChapters.length}</strong>{" "}
                      chương
                    </span>
                    {/* Logic hiển thị đơn giản để nhắc user */}
                    {(() => {
                      const plan = (story as any).length_plan;
                      const count = publishedChapters.length;
                      let min = 0;
                      if (plan === "super_short") min = 1;
                      if (plan === "short") min = 5;
                      if (plan === "novel") min = 20;

                      return count >= min ? (
                        <span className="text-green-600 font-bold flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Đủ điều kiện
                        </span>
                      ) : (
                        <span className="text-red-500 font-bold">
                          Chưa đủ (Cần &ge; {min})
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

          {/* Dialog xác nhận hoàn thành truyện */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="w-full"
                disabled={isCompleting || isCompleted || !canCompleteStory}
              >
                {isCompleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {canCompleteStory
                      ? "Đánh dấu Hoàn thành"
                      : "Chưa thể hoàn thành"}
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Xác nhận Hoàn thành Truyện
                </AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-3">
                    <p>
                      Bạn có chắc chắn muốn <strong>HOÀN THÀNH</strong> truyện{" "}
                      <strong>"{story.title}"</strong>?
                    </p>
                    <p>Sau khi hoàn thành:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>
                        Bạn sẽ không thể cập nhật thêm nội dung cho truyện này
                      </li>
                      <li>
                        Truyện sẽ được đánh dấu là "Hoàn thành" với độc giả
                      </li>
                      <li>Bạn sẽ được phép tạo truyện mới</li>
                    </ul>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy bỏ</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCompleteStory}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Xác nhận Hoàn thành
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
