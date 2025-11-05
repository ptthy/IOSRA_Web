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
} from "lucide-react";
import { storyService } from "@/services/storyService";
import { chapterService } from "@/services/chapterService"; // Import chapterService
import type { Story, Chapter } from "@/services/apiTypes";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { ImageWithFallback } from "@/components/ui/image-with-fallback";
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
export default function StoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;

  const [story, setStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChaptersLoading, setIsChaptersLoading] = useState(false);

  useEffect(() => {
    loadStory();
  }, [storyId]);

  const loadStory = async () => {
    setIsLoading(true);
    try {
      const data = await storyService.getStoryDetails(storyId);
      setStory(data);

      // Nếu truyện đã published, load chapters
      if (data.status === "published") {
        await loadChapters(data.storyId);
      }
    } catch (error) {
      console.error("Error loading story:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadChapters = async (storyId: string) => {
    setIsChaptersLoading(true);
    try {
      // Chỉ lấy chapters có status là "published" để hiển thị cho độc giả
      const data = await chapterService.getAllChapters(storyId, "published");
      setChapters(data);
    } catch (error) {
      console.error("Error loading chapters:", error);
      // Nếu có lỗi, vẫn tiếp tục hiển thị trang nhưng không có chapters
      setChapters([]);
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

  // Sửa: cập nhật getStatusBadge để dùng status chữ thường
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
      default:
        return { label: status, variant: "secondary" as const, icon: BookOpen };
    }
  };

  const statusInfo = getStatusBadge(story.status);
  const StatusIcon = statusInfo.icon;

  // Trang public chỉ hiển thị khi truyện đã published
  if (story.status !== "published") {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <BookOpen className="h-16 w-16 mb-4 text-muted-foreground" />
        <p className="text-muted-foreground mb-4">
          {story.status === "draft" && "Truyện đang trong giai đoạn bản thảo"}
          {story.status === "pending" && "Truyện đang chờ duyệt"}
          {story.status === "rejected" && "Truyện đã bị từ chối"}
        </p>
        <Button onClick={() => handleNavigate("home")}>
          Quay lại Trang Chủ
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
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
            <div className="flex-1 space-y-4">
              {/* Title & Status */}
              <div>
                <h1 className="text-2xl mb-2 font-bold">{story.title}</h1>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={statusInfo.variant}
                    className={statusInfo.className}
                  >
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusInfo.label}
                  </Badge>
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

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t">
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
                {story.aiScore !== undefined && (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5 font-bold">
                        Điểm AI
                      </p>
                      <p className="text-sm font-semibold text-primary">
                        {story.aiScore.toFixed(2)} / 1.00
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5 font-bold">
                        Kết quả
                      </p>
                      <p className="text-sm">
                        {story.aiScore >= 0.5 ? "✅ Đạt" : "❌ Không đạt"}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* AI Message */}
              {story.aiNote && (
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-1 font-bold">
                    Phản hồi AI:
                  </p>
                  <p className="text-sm italic text-muted-foreground">
                    "{extractVietnameseFeedback(story.aiNote)}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chapters Section - Hiển thị chapters từ API thật */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Danh sách Chương</CardTitle>
              <CardDescription>
                Các chương đã được xuất bản của truyện này
              </CardDescription>
            </div>
            <Badge variant="outline">{chapters.length} chương</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isChaptersLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : chapters.length > 0 ? (
            <div className="space-y-3">
              {chapters.map((chapter, index) => (
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
                      <p className="text-xs text-muted-foreground">
                        {chapter.publishedAt
                          ? `Xuất bản: ${new Date(
                              chapter.publishedAt
                            ).toLocaleDateString("vi-VN")}`
                          : "Chưa xuất bản"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-sm text-muted-foreground mb-4">
                Chưa có chương nào được xuất bản
              </p>
              <p className="text-xs text-muted-foreground">
                Hãy bắt đầu hoàn thiện tác phẩm ...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
