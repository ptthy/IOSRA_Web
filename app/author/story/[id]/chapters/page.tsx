//app/author/story/[id]/chapters/page.tsx
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
} from "lucide-react";
import { storyService } from "@/services/storyService";
import { chapterService } from "@/services/chapterService";
import type { Story, Chapter } from "@/services/apiTypes";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function ManageChaptersPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;

  const [story, setStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    loadData();
  }, [storyId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [storyData, chaptersData] = await Promise.all([
        storyService.getStoryDetails(storyId),
        chapterService.getAllChapters(storyId),
      ]);
      setStory(storyData);
      setChapters(chaptersData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Không thể tải thông tin");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteStory = async () => {
    setIsCompleting(true);
    try {
      // Validation chi tiết hơn
      const publishedChapters = chapters.filter(
        (ch) => ch.status === "published"
      );

      console.log("🔍 Validation before completing story:", {
        storyStatus: story?.status,
        publishedChapters: publishedChapters.length,
        storyId: storyId,
      });

      // Kiểm tra điều kiện chi tiết
      if (publishedChapters.length < 1) {
        toast.error("❌ Cần ít nhất 1 chương đã xuất bản để hoàn thành truyện");
        setIsCompleting(false);
        return;
      }

      if (story?.status === "completed") {
        toast.error("❌ Truyện này đã được hoàn thành rồi");
        setIsCompleting(false);
        return;
      }

      if (story?.status !== "published") {
        toast.error("❌ Chỉ có thể hoàn thành truyện đã được xuất bản");
        setIsCompleting(false);
        return;
      }

      console.log("🚀 Calling completeStory API...");
      await storyService.completeStory(storyId);

      toast.success(
        "🎉 Đã đánh dấu truyện hoàn thành! Bạn có thể tạo truyện mới."
      );

      // Reload data để cập nhật trạng thái
      setTimeout(() => {
        loadData();
        setTimeout(() => {
          router.push("/author/overview");
        }, 1000);
      }, 500);
    } catch (error: any) {
      console.error("💥 Error in handleCompleteStory:", error);

      // Hiển thị thông báo lỗi chi tiết
      const errorMessage =
        error.message || "Có lỗi xảy ra khi hoàn thành truyện";

      // Kiểm tra nếu là lỗi thời gian chờ
      if (errorMessage.includes("bạn có thể hoàn thành truyện sau")) {
        toast.error(`⏳ ${errorMessage}`, {
          duration: 8000, // Hiển thị lâu hơn
        });
      } else {
        toast.error(`❌ ${errorMessage}`);
      }

      setIsCompleting(false);
    }
  };

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

  // Hàm riêng để xem chương chi tiết
  // const handleViewChapter = (chapterId: string) => {
  //   console.log("👁️ Viewing chapter:", { storyId, chapterId });
  //   router.push(`/author/story/${storyId}/chapter/${chapterId}`);
  // };
  const handleViewChapter = (chapterId: string) => {
    console.log("👁️ Viewing chapter:", { storyId, chapterId });
    router.push(`/author/story/${storyId}/chapter/${chapterId}`);
  };

  // Hàm riêng để chỉnh sửa chương
  const handleEditChapter = (chapterId: string) => {
    console.log("✏️ Editing chapter:", { storyId, chapterId });
    router.push(`/author/story/${storyId}/chapter/${chapterId}/edit`);
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
      <div className="text-center py-16">
        <p className="text-muted-foreground mb-4">Không tìm thấy truyện</p>
        <Button onClick={() => router.push("/author/overview")}>
          Quay lại Dashboard
        </Button>
      </div>
    );
  }

  const isCompleted = story.status === "completed";
  const publishedChapters = chapters.filter((ch) => ch.status === "published");
  const canCompleteStory = publishedChapters.length >= 1;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl mb-2">Quản lý Chương</h1>
          <p className="text-sm text-muted-foreground">
            Truyện: <strong>{story.title}</strong>
          </p>
        </div>
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 flex-shrink-0">
          Đã xuất bản
        </Badge>
      </div>

      {/* Story Info */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin truyện</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tên truyện</p>
              <p>{story.title}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Thể loại</p>
              <div className="flex gap-2">
                {story.tags?.map((tag) => (
                  <Badge key={tag.tagId} variant="secondary">
                    {tag.tagName}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Mô tả</p>
            <p className="text-sm">{story.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
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

      {/* Chapters List */}
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
              <Button
                variant="outline"
                onClick={() => handleNavigate("chapter-editor", { storyId })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Đăng Chương Đầu Tiên
              </Button>
            </div>
          ) : (
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
                          : chapter.status === "draft"
                          ? "Bản nháp"
                          : chapter.status}
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
                        {chapter.status === "draft" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditChapter(chapter.chapterId)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Sửa
                          </Button>
                        )}
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

        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                <strong>Lưu ý quan trọng:</strong> Sau khi đánh dấu hoàn thành,
                bạn sẽ không thể cập nhật thêm nội dung cho truyện này. Hãy chắc
                chắn rằng bạn đã hoàn tất toàn bộ tác phẩm.
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-2">
                <strong>Quy định:</strong> Truyện phải được xuất bản ít nhất 30
                ngày trước khi có thể đánh dấu hoàn thành.
              </p>
            </div>
          </div>

          {/* Thêm thông tin về thời gian chờ nếu có */}
          {story?.publishedAt && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Thời gian xuất bản:</strong> Truyện đã được xuất bản
                  vào {new Date(story.publishedAt).toLocaleDateString("vi-VN")}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                  Bạn có thể hoàn thành truyện sau khi đủ 30 ngày kể từ ngày
                  xuất bản.
                </p>
              </div>
            </div>
          )}

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
                      <li>
                        Bạn sẽ được phép tạo truyện mới theo quy định của
                        ToraNovel
                      </li>
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
