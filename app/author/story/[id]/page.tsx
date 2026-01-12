//app/story/[id]/page.tsx

/**
 * MỤC ĐÍCH:
 * - Hiển thị toàn bộ thông tin chi tiết của một truyện cho tác giả
 * - Cung cấp giao diện xem thông tin, trạng thái kiểm duyệt và quản lý chương
 * - Cho phép tác giả theo dõi tình trạng duyệt (AI + ContentMod)
 *
 * CHỨC NĂNG CHÍNH:
 * 1. Hiển thị thông tin chi tiết truyện:
 *    - Cover image, tiêu đề, mô tả, thể loại
 *    - Trạng thái (draft, pending, published, hidden, rejected, completed)
 *    - Metadata: ngày tạo, cập nhật, độ dài dự kiến, ngôn ngữ
 *
 * 2. Hiển thị kết quả kiểm duyệt:
 *    - Điểm AI và kết quả AI (approved/rejected)
 *    - Trạng thái duyệt thủ công từ ContentMod
 *    - Ghi chú từ moderator
 *    - Báo cáo kiểm duyệt AI chi tiết với các vi phạm phân loại
 *
 * 3. Quản lý chương:
 *    - Hiển thị danh sách chương theo trạng thái truyện
 *    - Filter: published/completed chỉ hiện chương đã xuất bản
 *    - Hiển thị trạng thái và ngày xuất bản từng chương
 *
 * 4. Hỗ trợ đa trạng thái:
 *    - DRAFT: Cho phép chỉnh sửa thông tin
 *    - PENDING: Hiển thị thông báo chờ duyệt
 *    - REJECTED: Hiển thị feedback từ AI/ContentMod
 *    - HIDDEN: Chỉ tác giả có thể xem
 *    - PUBLISHED/COMPLETED: Hiển thị cho độc giả
 *
 * ĐẶC ĐIỂM NỔI BẬT:
 * - Xử lý feedback đa ngôn ngữ (trích xuất feedback tiếng Việt)
 * - Phân loại vi phạm với icon và màu sắc riêng (8 loại vi phạm)
 * - Tích hợp component AiModerationReport để hiển thị vi phạm chi tiết
 * - Navigation thông minh giữa các trang quản lý
 * - Responsive design với grid layout
 * - Xử lý lỗi API thống nhất với helper function
 *
 * COMPONENTS TÍCH HỢP:
 * - AiModerationReport: Hiển thị báo cáo kiểm duyệt AI
 * - ImageWithFallback: Hiển thị ảnh với fallback khi lỗi
 * - Alert: Hiển thị thông báo theo trạng thái
 * - Badge: Hiển thị trạng thái với styling phù hợp
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  BookOpen,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Edit,
  FileText,
  Lightbulb,
  AlertTriangle,
  EyeOff,
  ShieldAlert,
  AlertCircle,
  Fingerprint,
  Languages,
  FileWarning,
  SearchCode,
  PenTool,
  Link,
  Skull,
  UserCheck,
  MessageSquare,
} from "lucide-react";
import { storyService } from "@/services/storyService";
import { chapterService } from "@/services/chapterService";
import type { Story, Chapter } from "@/services/apiTypes";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { toast } from "sonner";
import { AiModerationReport } from "@/components/AiModerationReport";

/**
 * HÀM TRÍCH XUẤT FEEDBACK TIẾNG VIỆT TỪ FEEDBACK STRING
 *
 * VẤN ĐỀ GIẢI QUYẾT:
 * - AI feedback có thể chứa cả tiếng Anh và tiếng Việt
 * - Format: "English feedback... Tiếng Việt: [feedback tiếng Việt]"
 * - Cần extract phần tiếng Việt để hiển thị cho user
 *
 * LOGIC XỬ LÝ:
 * 1. Dùng regex tìm cụm "Tiếng Việt:" (không phân biệt hoa thường)
 * 2. Nếu tìm thấy -> lấy phần sau cụm đó
 * 3. Nếu không tìm thấy -> trả về toàn bộ feedback
 *
 * TẠI SAO CẦN HÀM NÀY:
 * - Người dùng Việt Nam dễ hiểu feedback tiếng Việt hơn
 * - AI có thể trả về feedback 2 ngôn ngữ
 * - Ưu tiên hiển thị ngôn ngữ phù hợp với user
 */
const extractVietnameseFeedback = (
  feedback: string | null | undefined
): string | null => {
  if (!feedback) return null;

  // Sử dụng Regex để tìm cụm "Tiếng Việt:" hoặc "Tiếng việt:" (không phân biệt hoa thường)
  const regex = /Tiếng\s+việt\s*:/i;
  const match = feedback.match(regex);

  if (match && match.index !== undefined) {
    // Lấy toàn bộ nội dung sau cụm từ khớp
    return feedback.substring(match.index + match[0].length).trim();
  }

  // Nếu không tìm thấy nhãn "Tiếng Việt", kiểm tra xem có đoạn văn tiếng Nhật/Anh không.
  // Nếu feedback quá dài và chứa cả 2 ngôn ngữ mà không có nhãn,
  // ta ưu tiên trả về chính nó nhưng đây là phương án dự phòng.
  return feedback.trim();
};

/**
 * HÀM TRẢ VỀ STYLE CHO CÁC LOẠI VI PHẠM KHÁC NHAU
 *
 * MỤC ĐÍCH:
 * - Mỗi loại vi phạm có icon, màu sắc và label riêng
 * - Tạo visual distinction giữa các loại vi phạm
 * - Giúp user dễ nhận biết loại vấn đề
 *
 * CẤU TRÚC DỮ LIỆU:
 * - labelVn: Label tiếng Việt cho loại vi phạm
 * - icon: React component icon từ lucide-react
 * - color: Tailwind CSS classes cho styling
 *
 * 8 LOẠI VI PHẠM ĐƯỢC HỖ TRỢ:
 * 1. wrong_language: Ngôn ngữ không hợp lệ
 * 2. sexual_explicit: Nội dung nhạy cảm/NSFW
 * 3. violent_gore: Bạo lực & Máu me
 * 4. spam_repetition: Spam & Lặp từ ngữ
 * 5. url_redirect: Liên kết ngoài/Quảng cáo
 * 6. grammar_spelling: Lỗi trình bày/Chính tả
 * 7. weak_prose: Văn phong cần cải thiện
 * 8. inconsistent_content: Nội dung không đồng nhất
 */
const getViolationStyle = (label: string) => {
  const styles: Record<string, { labelVn: string; icon: any; color: string }> =
    {
      wrong_language: {
        labelVn: "Ngôn ngữ không hợp lệ",
        icon: Languages,
        color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20",
      },
      sexual_explicit: {
        labelVn: "Nội dung nhạy cảm/NSFW",
        icon: AlertTriangle,
        color: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20",
      },
      violent_gore: {
        labelVn: "Bạo lực & Máu me",
        icon: Skull,
        color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20",
      },
      spam_repetition: {
        labelVn: "Spam & Lặp từ ngữ",
        icon: Fingerprint,
        color:
          "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20",
      },
      url_redirect: {
        labelVn: "Liên kết ngoài/Quảng cáo",
        icon: Link,
        color:
          "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20",
      },
      grammar_spelling: {
        labelVn: "Lỗi trình bày/Chính tả",
        icon: PenTool,
        color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20",
      },
      weak_prose: {
        labelVn: "Văn phong cần cải thiện",
        icon: BookOpen,
        color:
          "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950/20",
      },
      inconsistent_content: {
        labelVn: "Nội dung không đồng nhất",
        icon: FileWarning,
        color:
          "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20",
      },
    };
  return (
    styles[label] || {
      labelVn: "Vi phạm khác",
      icon: ShieldAlert,
      color: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/40",
    }
  );
};
export default function StoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;
  // State quản lý dữ liệu
  const [story, setStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChaptersLoading, setIsChaptersLoading] = useState(false);

  /**
   * HELPER FUNCTION XỬ LÝ LỖI API - GIỐNG CÁC FILE KHÁC
   *
   * LOGIC XỬ LÝ:
   * 1. Kiểm tra lỗi validation từ backend (details)
   * 2. Nếu có validation errors -> hiển thị lỗi đầu tiên
   * 3. Nếu có message từ backend -> hiển thị message đó
   * 4. Fallback: dùng message mặc định hoặc từ response
   *
   * ƯU ĐIỂM CỦA CÁCH TIẾP CẬN NÀY:
   * - Xử lý được nhiều error format khác nhau
   * - Ưu tiên hiển thị lỗi chi tiết nhất
   * - Giảm code duplicate trong các components
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
   * LOAD THÔNG TIN TRUYỆN KHI COMPONENT MOUNT
   *
   * FLOW XỬ LÝ:
   * 1. Set isLoading = true để hiển thị loading
   * 2. Gọi API getStoryDetails để lấy thông tin đầy đủ
   * 3. Lưu story vào state
   * 4. Gọi loadChapters để lấy danh sách chương
   * 5. Xử lý lỗi nếu có
   * 6. Set isLoading = false để hiển thị content
   *
   * TẠI SAO LOAD CHAPTERS TRONG HÀM NÀY:
   * - Story và chapters có quan hệ 1-n
   * - Cần hiển thị cả story info và chapters list
   * - Tránh gọi API nhiều lần không cần thiết
   */
  useEffect(() => {
    loadStory();
  }, [storyId]); // Chỉ chạy lại khi storyId thay đổi

  const loadStory = async () => {
    setIsLoading(true);
    try {
      // 1. Load thông tin truyện từ API
      const data = await storyService.getStoryDetails(storyId);
      setStory(data);

      // 2. Load chapters cho tất cả trạng thái
      await loadChapters(data.storyId);
    } catch (error: any) {
      // --- DÙNG HELPER ---
      handleApiError(error, "Không thể tải thông tin truyện.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * LOAD DANH SÁCH CHAPTERS
   *
   * FLOW XỬ LÝ:
   * 1. Set isChaptersLoading = true
   * 2. Gọi API getAllChapters (load tất cả chapters, không filter)
   * 3. Lưu chapters vào state
   * 4. Xử lý lỗi và reset chapters về [] nếu có lỗi
   * 5. Set isChaptersLoading = false
   *
   * TẠI SAO LOAD TẤT CẢ CHAPTERS (KHÔNG FILTER):
   * - Tác giả cần xem tất cả chapters (kể cả draft, pending)
   * - Chỉ filter khi hiển thị (trong getDisplayChapters)
   * - Tránh phải gọi API nhiều lần cho các filter khác nhau
   */
  const loadChapters = async (storyId: string) => {
    setIsChaptersLoading(true);
    try {
      // Load tất cả chapters, không filter theo status
      const data = await chapterService.getAllChapters(storyId);
      setChapters(data);
    } catch (error: any) {
      setChapters([]); // Reset về mảng rỗng để tránh lỗi UI
      // --- DÙNG HELPER ---
      handleApiError(error, "Không thể tải danh sách chương.");
    } finally {
      setIsChaptersLoading(false);
    }
  };

  /**
   * HELPER FUNCTION ĐỂ NAVIGATE ĐẾN CÁC TRANG KHÁC
   *
   * MỤC ĐÍCH:
   * - Centralize navigation logic
   * - Tránh hardcode URLs trong nhiều nơi
   * - Dễ thay đổi route structure sau này
   *
   * CẤU TRÚC:
   * - routes object map page key -> route string
   * - Có thể truyền params qua navParams
   */
  const handleNavigate = (page: string, navParams?: any) => {
    const routes: Record<string, string> = {
      home: "/",
      discover: "/discover",
      "author-dashboard": "/author/overview",
      "submit-ai": `/author/story/${navParams?.storyId}/submit-ai`,
      "ai-result": `/author/story/${navParams?.storyId}/ai-result`,
      "outline-editor": `/author/story/${navParams?.storyId}/outline`,
      "chapter-editor": navParams?.chapterId
        ? `/author/story/${navParams?.storyId}/chapter/${navParams.chapterId}`
        : `/author/story/${navParams?.storyId}/chapter/new`,
      "manage-chapters": `/author/story/${navParams?.storyId}/chapters`,
      "read-chapter": `/story/${navParams?.storyId}/chapter/${navParams?.chapterId}`,
    };
    const route = routes[page] || `/${page}`;
    router.push(route);
  };

  const handleReadChapter = (chapterId: string) => {
    handleNavigate("read-chapter", { storyId, chapterId });
  };
  // Hiển thị loading spinner khi đang tải dữ liệu
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  // Hiển thị thông báo nếu không tìm thấy truyện
  if (!story) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <BookOpen className="h-16 w-16 mb-4 text-muted-foreground" />
        <p className="text-muted-foreground mb-4">Không tìm thấy truyện</p>
        <Button onClick={() => handleNavigate("home")}>
          Quay lại Trang Chủ
        </Button>
      </div>
    );
  }

  /**
   * HÀM TRẢ VỀ THÔNG TIN BADGE CHO TỪNG TRẠNG THÁI TRUYỆN
   *
   * MỤC ĐÍCH:
   * - Mỗi trạng thái có label, variant, icon và className riêng
   * - Tạo visual consistency trong toàn ứng dụng
   * - Dễ thêm/sửa trạng thái mới
   *
   * 6 TRẠNG THÁI ĐƯỢC HỖ TRỢ:
   * 1. draft: Bản nháp (chưa gửi AI)
   * 2. pending: Chờ duyệt (đã gửi AI, chờ ContentMod)
   * 3. published: Đã xuất bản
   * 4. hidden: Đã ẩn (chỉ tác giả thấy)
   * 5. rejected: Bị từ chối
   * 6. completed: Đã hoàn thành
   */
  const getStatusBadge = (status: Story["status"]) => {
    switch (status) {
      case "draft":
        return {
          label: "Bản nháp",
          variant: "secondary" as const,
          icon: Clock,
        };
      case "pending":
        return {
          label: "Chờ duyệt",
          variant: "secondary" as const,
          icon: Clock,
          className:
            "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
        };
      case "published":
        return {
          label: "Đã xuất bản",
          variant: "secondary" as const,
          icon: CheckCircle2,
          className:
            "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
        };
      case "hidden":
        return {
          label: "Đã ẩn",
          variant: "secondary" as const,
          icon: EyeOff, // Icon con mắt gạch chéo
          className:
            "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800",
        };
      case "rejected":
        return {
          label: "Bị từ chối",
          variant: "destructive" as const,
          icon: XCircle,
        };
      case "completed":
        return {
          label: "Đã hoàn thành",
          variant: "default" as const,
          icon: CheckCircle2,
          className:
            "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
        };
      default:
        return { label: status, variant: "secondary" as const, icon: BookOpen };
    }
  };

  const statusInfo = getStatusBadge(story.status);
  const StatusIcon = statusInfo.icon;

  /**
   * HÀM TRẢ VỀ ALERT THÔNG BÁO ĐẶC BIỆT CHO TỪNG TRẠNG THÁI
   *
   * MỤC ĐÍCH:
   * - Cung cấp hướng dẫn/feedback theo trạng thái
   * - Mỗi trạng thái có message và styling riêng
   * - Giúp user hiểu được trạng thái hiện tại và hành động tiếp theo
   *
   * LOGIC XỬ LÝ:
   * - Switch case dựa trên story.status
   * - Mỗi case trả về Alert component với styling phù hợp
   * - rejected status có xử lý đặc biệt: extract Vietnamese feedback
   */
  const getStatusAlert = () => {
    switch (story.status) {
      case "draft":
        return (
          <Alert className="mb-6 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <Clock className="h-4 w-4 text-amber-600" />
            <AlertDescription>
              Truyện đang trong giai đoạn bản thảo. Bạn có thể chỉnh sửa và gửi
              cho AI đánh giá.
            </AlertDescription>
          </Alert>
        );
      case "pending":
        return (
          <Alert className="mb-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <Clock className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              Truyện đang chờ được Content Mod đánh giá. Vui lòng chờ kết quả.
            </AlertDescription>
          </Alert>
        );
      case "hidden":
        return (
          <Alert className="mb-6 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <EyeOff className="h-4 w-4 text-amber-600" />
            <AlertDescription>
              Truyện này đang bị ẩn khỏi danh sách công khai. Chỉ có bạn mới
              nhìn thấy.
            </AlertDescription>
          </Alert>
        );
      case "rejected":
        // Gọi hàm extract để lấy feedback tiếng Việt
        const rawFeedback = extractVietnameseFeedback(story.aiFeedback);

        // Logic hiển thị: Nếu có feedback thì hiện, không thì hiện thông báo mặc định
        const feedbackDisplay =
          rawFeedback ||
          "Nội dung không đạt yêu cầu kiểm duyệt của hệ thống AI.";

        return (
          <Alert className="mb-6 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="leading-relaxed">
              <strong className="block mb-1">Truyện đã bị từ chối:</strong>
              <span className="text-sm">{feedbackDisplay}</span>
            </AlertDescription>
          </Alert>
        );
      case "completed":
        return (
          <Alert className="mb-6 bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
            <CheckCircle2 className="h-4 w-4 text-purple-600" />
            <AlertDescription>
              Truyện đã được hoàn thành. Cảm ơn bạn đã sáng tác!
            </AlertDescription>
          </Alert>
        );
      default:
        return null;
    }
  };

  /**
   * FILTER CHAPTERS THEO STATUS ĐỂ HIỂN THỊ
   *
   * BUSINESS LOGIC:
   * - Published/completed stories: chỉ hiện published chapters (cho độc giả)
   * - Các status khác: hiện tất cả chapters (cho tác giả quản lý)
   *
   * TẠI SAO CÓ LOGIC NÀY:
   * - Published story: độc giả chỉ nên xem chapters đã xuất bản
   * - Draft/pending story: tác giả cần xem tất cả để quản lý
   * - Hidden story: tác giả vẫn cần xem tất cả để chỉnh sửa
   */
  const getDisplayChapters = () => {
    if (story.status === "published" || story.status === "completed") {
      return chapters.filter((ch) => ch.status === "published");
    }
    return chapters; // Hiển thị tất cả chapters cho các trạng thái khác
  };

  const displayChapters = getDisplayChapters();

  return (
    <div className="space-y-6 pb-8">
      {/* Status Alert - Hiển thị alert theo trạng thái */}
      {getStatusAlert()}

      {/* Story Info Card - Card chính hiển thị thông tin truyện */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Cover Image */}
            <div className="flex-shrink-0">
              <div className="w-40 rounded-lg overflow-hidden shadow-md border">
                {story.coverUrl ? (
                  <ImageWithFallback
                    src={story.coverUrl}
                    alt={story.title}
                    className="w-full aspect-[2/3] object-cover"
                  />
                ) : (
                  <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>

            {/* Story Info */}
            <div className="flex-1 space-y-5">
              {/* Title & Status */}
              <div>
                <h1 className="text-2xl mb-2 font-bold">{story.title}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={statusInfo.variant}
                    className={statusInfo.className}
                  >
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusInfo.label}
                  </Badge>

                  {/* isPremium */}
                  {story.isPremium && (
                    <Badge
                      variant="default"
                      className="bg-amber-500 text-white"
                    >
                      Premium
                    </Badge>
                  )}
                </div>
              </div>

              {/* Tags */}
              {story.tags && story.tags.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5 font-bold">
                    Thể loại
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {story.tags.map((tag) => (
                      <Badge
                        key={tag.tagId}
                        variant="outline"
                        className="text-xs"
                      >
                        {tag.tagName}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5 font-bold">
                  Mô tả
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {story.description}
                </p>
              </div>

              {/* Độ dài dự kiến  */}
              <div className="flex flex-wrap items-start gap-x-12 gap-y-4">
                {story.lengthPlan && (
                  <div className="flex flex-col">
                    <p className="text-xs text-muted-foreground mb-1.5 font-bold">
                      Độ dài dự kiến
                    </p>
                    <div className="h-7 flex items-center">
                      {" "}
                      {/* Cố định chiều cao để ngang hàng */}
                      {story.lengthPlan === "super_short" && (
                        <Badge
                          variant="secondary"
                          className="bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 border-none"
                        >
                          Siêu ngắn (từ 1-5 chương)
                        </Badge>
                      )}
                      {story.lengthPlan === "short" && (
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-none"
                        >
                          Ngắn (từ 6-20 chương)
                        </Badge>
                      )}
                      {story.lengthPlan === "novel" && (
                        <Badge
                          variant="secondary"
                          className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 border-none"
                        >
                          Dài (trên 20 chương)
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                {/* Ngôn ngữ */}
                <div className="flex flex-col">
                  <p className="text-xs text-muted-foreground mb-1.5 font-bold">
                    Ngôn ngữ
                  </p>
                  <div className="h-7 flex items-center">
                    {" "}
                    {/* Cố định chiều cao h-7 khớp với bên trái */}
                    {story.languageCode === "vi-VN" && (
                      <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 dark:bg-red-900/30 dark:text-red-400">
                        Tiếng Việt
                      </Badge>
                    )}
                    {story.languageCode === "en-US" && (
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400">
                        English
                      </Badge>
                    )}
                    {story.languageCode === "zh-CN" && (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400">
                        中文 (Chinese)
                      </Badge>
                    )}
                    {story.languageCode === "ja-JP" && (
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400">
                        日本語 (Japanese)
                      </Badge>
                    )}
                    {!["vi-VN", "en-US", "zh-CN", "ja-JP"].includes(
                      story.languageCode
                    ) && <Badge variant="outline">{story.languageCode}</Badge>}
                  </div>
                </div>
              </div>
              {/* Metadata Grid – thêm aiResult, moderatorStatus, moderatorNote */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5 font-bold">
                    Ngày tạo
                  </p>
                  <p className="text-sm">
                    {new Date(story.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5 font-bold">
                    Cập nhật
                  </p>
                  <p className="text-sm">
                    {new Date(story.updatedAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>

                {/* Điểm AI + Kết quả AI */}
                {story.aiScore !== undefined && (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5 font-bold">
                        Điểm AI
                      </p>
                      <p className="text-sm font-semibold text-primary">
                        {story.aiScore != null
                          ? `${Number(story.aiScore).toFixed(1)} / 10.0`
                          : "- / 10.0"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5 font-bold">
                        Kết quả AI
                      </p>
                      <p className="text-sm">
                        {story.aiResult === "approved" ? "Đạt" : "Không đạt"}
                        {story.aiResult &&
                          story.aiResult !== "approved" &&
                          ` (${story.aiResult})`}
                      </p>
                    </div>
                  </>
                )}

                {/* Moderator Status & Note (nếu có) */}
                {story.moderatorStatus && (
                  <div className="md:col-span-2">
                    <p className="text-xs text-muted-foreground mb-0.5 font-bold">
                      Trạng thái duyệt thủ công
                    </p>
                    <Badge
                      variant={
                        story.moderatorStatus === "approved"
                          ? "default"
                          : "destructive"
                      }
                    >
                      {story.moderatorStatus === "approved"
                        ? "Đã duyệt"
                        : "Bị từ chối"}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Moderator Note – nếu có */}
              {story.moderatorNote && (
                <Alert className="bg-orange-50 dark:bg-orange-950/30 border-orange-200">
                  <AlertDescription className="text-sm">
                    <strong>Ghi chú từ Moderator:</strong> {story.moderatorNote}
                  </AlertDescription>
                </Alert>
              )}

              {/* Section: Kết quả kiểm duyệt AI chi tiết */}
              <AiModerationReport
                aiFeedback={story.aiFeedback}
                aiViolations={story.aiViolations}
                contentType="truyện"
              />
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                      <UserCheck className="w-4 h-4 text-blue-500" />
                      <h3 className="font-bold text-s uppercase tracking-wider">
                        Trạng thái kiểm duyệt từ ContentMod
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`px-3 py-1 text-xs font-bold ${
                          story?.moderatorStatus === "approved"
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                            : story?.moderatorStatus === "rejected"
                            ? "bg-red-100 text-red-700 border-red-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {story?.moderatorStatus === "approved"
                          ? "ĐÃ PHÊ DUYỆT"
                          : story?.moderatorStatus === "rejected"
                          ? "BỊ TỪ CHỐI"
                          : "KHÔNG CÓ"}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                      <MessageSquare className="w-4 h-4 text-blue-500" />
                      <h3 className="font-bold text-s uppercase tracking-wider">
                        Ghi chú từ ContentMod
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground italic bg-white/40 p-3 rounded-lg border border-slate-100">
                      {story?.moderatorNote ||
                        "Nội dung không có ghi chú vi phạm."}
                    </p>
                  </div>
                </div>
              </div>
              {/* Dàn ý chi tiết – rút gọn + nút xem đầy đủ */}
              {story.outline && (
                <div className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground font-bold flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Dàn ý chi tiết
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(`/author/story/${story.storyId}/outline`)
                      }
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Dàn ý chi tiết
                    </Button>
                  </div>
                  <Card className="bg-muted/40 border-dashed">
                    <CardContent className="pt-4 text-sm text-muted-foreground max-h-60 overflow-y-auto whitespace-pre-line leading-relaxed">
                      {story.outline.length > 800
                        ? story.outline.substring(0, 800) +
                          "\n\n... (xem tiếp ở ở nút Dàn ý chi tiêt)"
                        : story.outline}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chapters Section - Hiển thị cho tất cả trạng thái (trừ rejected) */}
      {story.status !== "rejected" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Danh sách Chương</CardTitle>
                <CardDescription>
                  {story.status === "hidden"
                    ? "Các chương của truyện đang bị ẩn này"
                    : story.status === "published" ||
                      story.status === "completed"
                    ? "Các chương đã được xuất bản của truyện này"
                    : "Các chương của truyện (chưa xuất bản)"}
                </CardDescription>
              </div>
              <Badge variant="outline">
                {displayChapters.length} chương
                {story.status !== "published" &&
                  story.status !== "completed" &&
                  ` (${
                    chapters.filter((ch) => ch.status === "published").length
                  } đã xuất bản)`}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isChaptersLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : displayChapters.length > 0 ? (
              <div className="space-y-3">
                {displayChapters.map((chapter, index) => (
                  <div
                    key={chapter.chapterId}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-primary">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {chapter.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={
                              chapter.status === "published"
                                ? "default"
                                : chapter.status === "pending"
                                ? "secondary"
                                : "outline"
                            }
                            className="text-xs"
                          >
                            {chapter.status === "published"
                              ? "Đã xuất bản"
                              : chapter.status === "pending"
                              ? "Chờ duyệt"
                              : "Bản nháp"}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {chapter.publishedAt
                              ? `Xuất bản: ${new Date(
                                  chapter.publishedAt
                                ).toLocaleDateString("vi-VN")}`
                              : "Chưa xuất bản"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Read button chỉ hiện cho published chapters trong published/hidden/completed stories */}
                      {(story.status === "published" ||
                        story.status === "completed" ||
                        story.status === "hidden") &&
                        chapter.status === "published" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/author/story/${storyId}/chapter/${chapter.chapterId}/view`
                              )
                            }
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Đọc
                          </Button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                <p className="text-sm text-muted-foreground mb-4">
                  {story.status === "draft" || story.status === "pending"
                    ? "Chưa có chương nào được đăng"
                    : "Chưa có chương nào được xuất bản"}
                </p>
                {story.status === "draft" && (
                  <Button
                    onClick={() => router.push(`/author/story/${storyId}/edit`)}
                    className="ml-3"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Chỉnh sửa thông tin
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
