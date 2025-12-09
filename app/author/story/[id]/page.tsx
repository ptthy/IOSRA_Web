//app/story/[id]/page.tsx
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
} from "lucide-react";
import { storyService } from "@/services/storyService";
import { chapterService } from "@/services/chapterService";
import type { Story, Chapter } from "@/services/apiTypes";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { toast } from "sonner";
const extractVietnameseFeedback = (
  feedback: string | null | undefined
): string | null => {
  if (!feedback) return null;

  const vietnameseIndex = feedback.indexOf("Tiếng Việt:");
  if (vietnameseIndex !== -1) {
    return feedback.substring(vietnameseIndex + "Tiếng Việt:".length).trim();
  }

  return feedback;
};

export default function StoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;

  const [story, setStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChaptersLoading, setIsChaptersLoading] = useState(false);
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
  useEffect(() => {
    loadStory();
  }, [storyId]);

  const loadStory = async () => {
    setIsLoading(true);
    try {
      const data = await storyService.getStoryDetails(storyId);
      setStory(data);

      // Load chapters cho tất cả trạng thái, không chỉ published
      await loadChapters(data.storyId);
      // } catch (error) {
      //   console.error("Error loading story:", error);
      // } finally {
      //   setIsLoading(false);
      // }
    } catch (error: any) {
      // --- DÙNG HELPER ---
      handleApiError(error, "Không thể tải thông tin truyện.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadChapters = async (storyId: string) => {
    setIsChaptersLoading(true);
    try {
      // Load tất cả chapters, không filter theo status
      const data = await chapterService.getAllChapters(storyId);
      setChapters(data);
      // } catch (error) {
      //   console.error("Error loading chapters:", error);
      //   setChapters([]);
      // } finally {
      //   setIsChaptersLoading(false);
      // }
    } catch (error: any) {
      setChapters([]); // Giữ nguyên logic reset mảng rỗng để tránh lỗi UI
      // --- DÙNG HELPER ---
      handleApiError(error, "Không thể tải danh sách chương.");
    } finally {
      setIsChaptersLoading(false);
    }
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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

  // Hiển thị thông báo đặc biệt cho các trạng thái
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
      case "rejected":
        const feedbackText = story.aiFeedback
          ? extractVietnameseFeedback(story.aiFeedback)
          : "Không đạt yêu cầu của hệ thống AI";

        return (
          <Alert className="mb-6 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription>
              <strong>Truyện đã bị từ chối:</strong> {feedbackText}
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

  // Filter chapters theo status để hiển thị
  const getDisplayChapters = () => {
    if (story.status === "published" || story.status === "completed") {
      return chapters.filter((ch) => ch.status === "published");
    }
    return chapters; // Hiển thị tất cả chapters cho các trạng thái khác
  };

  const displayChapters = getDisplayChapters();

  return (
    <div className="space-y-6 pb-8">
      {/* Status Alert */}
      {getStatusAlert()}

      {/* Story Info Card */}
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

              {/* Độ dài dự kiến – THEO HÌNH BẠN GỬI */}
              {story.lengthPlan && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5 font-bold">
                    Độ dài dự kiến
                  </p>
                  <div className="flex items-center gap-3">
                    {story.lengthPlan === "super_short" && (
                      <Badge
                        variant="secondary"
                        className="bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300"
                      >
                        Siêu ngắn (từ 1-5 chương)
                      </Badge>
                    )}
                    {story.lengthPlan === "short" && (
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                      >
                        Ngắn (từ 5-20 chương)
                      </Badge>
                    )}
                    {story.lengthPlan === "novel" && (
                      <Badge
                        variant="secondary"
                        className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
                      >
                        Dài (trên 20 chương)
                      </Badge>
                    )}
                  </div>
                </div>
              )}

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

              {/* AI Feedback */}
              {story.aiFeedback && (
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-1 font-bold">
                    Phản hồi AI:
                  </p>
                  <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                    <AlertDescription className="text-sm whitespace-pre-wrap">
                      {extractVietnameseFeedback(story.aiFeedback) ||
                        story.aiFeedback}
                    </AlertDescription>
                  </Alert>
                </div>
              )}

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
                          "\n\n... (xem tiếp ở trang dàn ý)"
                        : story.outline}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Action Buttons */}
              {/* <div className="flex gap-2 pt-4">
                {story.status === "draft" && (
                  <Button
                    onClick={() => router.push(`/author/story/${storyId}/edit`)}
                    className="ml-3"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Chỉnh sửa thông tin
                  </Button>
                )}
              </div> */}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chapters Section - Hiển thị cho tất cả trạng thái */}
      {story.status !== "rejected" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Danh sách Chương</CardTitle>
                <CardDescription>
                  {story.status === "published" || story.status === "completed"
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
                      {(story.status === "published" ||
                        story.status === "completed") &&
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
