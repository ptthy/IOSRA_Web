// app/author/story/[id]/chapter/[chapterId]/page.tsx
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  ArrowLeft,
  Edit,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  Star,
  MessageSquare,
  Download,
} from "lucide-react";
import { chapterService } from "@/services/chapterService";
import type { ChapterDetails } from "@/services/apiTypes";
import { toast } from "sonner";

// Base URL cho R2 bucket - có thể move ra file config sau
const R2_BASE_URL = "https://pub-15618311c0ec468282718f80c66bcc13.r2.dev";

// Hàm trích xuất phần tiếng Việt từ AI Feedback
const extractVietnameseFeedback = (feedback: string | null): string | null => {
  if (!feedback) return null;

  // Tìm phần tiếng Việt sau "Tiếng Việt:"
  const vietnameseIndex = feedback.indexOf("Tiếng Việt:");
  if (vietnameseIndex !== -1) {
    return feedback.substring(vietnameseIndex + "Tiếng Việt:".length).trim();
  }

  // Nếu không tìm thấy marker tiếng Việt, trả về toàn bộ feedback
  return feedback;
};

export default function AuthorChapterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;
  const chapterId = params.chapterId as string;

  const [chapter, setChapter] = useState<ChapterDetails | null>(null);
  const [chapterContent, setChapterContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadChapter();
  }, [storyId, chapterId]);

  const loadChapter = async () => {
    setIsLoading(true);
    try {
      const chapterData = await chapterService.getChapterDetails(
        storyId,
        chapterId
      );
      setChapter(chapterData);

      // Tải nội dung chương nếu có contentPath
      if (chapterData.contentPath) {
        loadChapterContent(chapterData.contentPath);
      } else if (chapterData.content) {
        // Nếu content đã có sẵn trong response
        setChapterContent(chapterData.content);
      }
    } catch (error: any) {
      console.error("Error loading chapter:", error);
      toast.error(error.message || "Không thể tải thông tin chương");
    } finally {
      setIsLoading(false);
    }
  };

  const loadChapterContent = async (contentPath: string) => {
    setIsLoadingContent(true);
    try {
      // Sử dụng API route thay vì fetch trực tiếp
      const apiUrl = `/api/chapter-content?path=${encodeURIComponent(
        contentPath
      )}`;
      console.log("🔍 [DEBUG] Loading chapter content via API:", apiUrl);

      const response = await fetch(apiUrl);

      console.log("🔍 [DEBUG] API response:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      console.log("🔍 [DEBUG] Content loaded via API:", {
        contentLength: data.content.length,
        first100Chars: data.content.substring(0, 100),
        hasContent: data.content.length > 0,
      });

      setChapterContent(data.content);
    } catch (error: any) {
      console.error("❌ [DEBUG] Error loading chapter content:", {
        error: error,
        message: error.message,
        stack: error.stack,
      });
      toast.error("Không thể tải nội dung chương");
      setChapterContent(null);
    } finally {
      setIsLoadingContent(false);
    }
  };

  const handleDownloadContent = () => {
    if (!chapterContent || !chapter) return;

    const blob = new Blob([chapterContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${chapter.title}.txt` || `chapter-${chapter.chapterNo}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSubmitForReview = async () => {
    if (!chapter) return;

    setIsSubmitting(true);
    try {
      await chapterService.submitChapterForReview(chapterId);
      toast.success("Đã gửi chương cho AI đánh giá thành công!");
      // Reload để cập nhật trạng thái mới
      loadChapter();
    } catch (error: any) {
      console.error("Error submitting chapter:", error);
      toast.error(error.message || "Có lỗi xảy ra khi gửi chương");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditChapter = () => {
    router.push(`/author/story/${storyId}/chapter/${chapterId}/edit`);
  };

  const handleBackToChapters = () => {
    router.push(`/author/story/${storyId}/chapters`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground mb-4">Không tìm thấy chương</p>
        <Button onClick={handleBackToChapters}>
          Quay lại danh sách chương
        </Button>
      </div>
    );
  }

  const canEdit = chapter.status === "draft";
  const canSubmit = chapter.status === "draft";
  const isPending = chapter.status === "pending";
  const isPublished = chapter.status === "published";

  // Trích xuất phần tiếng Việt từ AI Feedback
  const vietnameseFeedback = chapter
    ? extractVietnameseFeedback(chapter.aiFeedback)
    : null;
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={handleBackToChapters}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Chi tiết Chương</h1>
          <p className="text-muted-foreground">
            Quản lý và xem thông tin chi tiết chương truyện
          </p>
        </div>
      </div>

      {/* Chapter Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{chapter.title}</CardTitle>
              <CardDescription>Chương {chapter.chapterNo}</CardDescription>
            </div>
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
                : "Bản nháp"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-x-4 gap-y-6">
          {/* === CỘT 1 === */}
          <div className="space-y-6">
            {/* Số từ */}
            <div>
              <p className="text-sm text-slate-400 mb-1">Số từ</p>
              <p className="font-medium">{chapter.wordCount} từ</p>
            </div>
            {/* Tạo lúc */}
            <div className="text-sm">
              <p className="text-slate-400 mb-1">Tạo lúc</p>
              <p>{new Date(chapter.createdAt).toLocaleString("vi-VN")}</p>
            </div>
          </div>

          {/* === CỘT 2 === */}
          <div className="space-y-6">
            {/* Ngôn ngữ */}
            <div>
              <p className="text-sm text-slate-400 mb-1">Ngôn ngữ</p>
              <p className="font-medium">{chapter.languageName}</p>
            </div>
            {/* Xuất bản lúc */}
            {chapter.publishedAt && (
              <div className="text-sm">
                <p className="text-slate-400 mb-1">Xuất bản lúc</p>
                <p>{new Date(chapter.publishedAt).toLocaleString("vi-VN")}</p>
              </div>
            )}
          </div>

          {/* === CỘT 3 === */}
          <div className="space-y-6">
            {/* Giá */}
            <div>
              <p className="text-sm text-slate-400 mb-1">Giá</p>
              <p className="font-medium">
                {chapter.accessType === "free"
                  ? "Miễn phí"
                  : `${chapter.priceDias} Dias`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Assessment */}
      {chapter && (chapter.aiScore !== undefined || vietnameseFeedback) && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Star className="h-5 w-5" />
              Đánh giá AI
            </CardTitle>
            <CardDescription>
              Phân tích và đánh giá tự động từ hệ thống AI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {chapter.aiScore != null && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium">Điểm AI:</span>
                </div>
                <Badge
                  variant={
                    chapter.aiScore >= 0.8
                      ? "default"
                      : chapter.aiScore >= 0.6
                      ? "secondary"
                      : "destructive"
                  }
                  className="text-lg px-3 py-1"
                >
                  {chapter.aiScore.toFixed(2)}
                </Badge>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${chapter.aiScore * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            {vietnameseFeedback && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Nhận xét AI:</span>
                </div>
                <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                  <AlertDescription className="whitespace-pre-wrap text-sm">
                    {vietnameseFeedback}
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Trạng thái chương</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            {canEdit && (
              <Button onClick={handleEditChapter}>
                <Edit className="h-4 w-4 mr-2" />
                Chỉnh sửa
              </Button>
            )}

            {canSubmit && (
              <Button
                onClick={handleSubmitForReview}
                disabled={isSubmitting}
                variant="outline"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Gửi cho AI đánh giá
                  </>
                )}
              </Button>
            )}

            {isPending && (
              <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription>
                  Chương đang chờ được AI đánh giá và duyệt
                </AlertDescription>
              </Alert>
            )}

            {isPublished && (
              <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription>
                  Chương đã được xuất bản thành công
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Nội dung chương
              </CardTitle>
              <CardDescription></CardDescription>
            </div>
            {chapterContent && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadContent}
              >
                <Download className="h-4 w-4 mr-2" />
                Tải xuống
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 rounded-lg p-4 min-h-[200px] max-h-[600px] overflow-y-auto">
            {isLoadingContent ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Đang tải nội dung...
                </span>
              </div>
            ) : chapterContent ? (
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {chapterContent}
                </pre>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">
                  {isPublished
                    ? "Nội dung đã được xuất bản và có thể xem bởi độc giả"
                    : "Không thể tải nội dung chương"}
                </p>
                {chapter.contentPath && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() =>
                      chapter.contentPath &&
                      loadChapterContent(chapter.contentPath!)
                    }
                  >
                    Thử tải lại
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
