//app/author/overview/page.tsx
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

export default function AuthorDashboardPage() {
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    setIsLoading(true);
    try {
      // Sửa: Gọi getAllStories không có tham số hoặc chỉ với status
      const data = await storyService.getAllStories();
      setStories(data);
    } catch (error) {
      console.error("Error loading stories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onNavigate = (page: string, params?: any) => {
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

    const route = routes[page] || `/${page}`;
    router.push(route);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Sửa: Cập nhật các status để khớp với backend (chữ thường)
  const activeStory = stories.find(
    (s) =>
      s.status === "draft" || s.status === "pending" || s.status === "published"
  );
  const hasActiveStory = !!activeStory;

  // Sửa: Cập nhật getStatusBadge để dùng status chữ thường
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
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Sửa: Cập nhật getManageButtonText để dùng status chữ thường
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
        return "Quản lý";
    }
  };

  // Sửa: Cập nhật getManageRoute để dùng status chữ thường
  const getManageRoute = (status: Story["status"], storyId: string) => {
    switch (status) {
      case "draft":
        return { page: "submit-ai", params: { storyId } };
      case "pending":
      case "rejected":
        return { page: "story-detail", params: { storyId } };
      case "published":
        //return { page: "story-detail", params: { storyId } };
        return { page: "manage-chapters", params: { storyId } };
      default:
        return { page: "author-dashboard", params: undefined };
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl mb-2">Trạng Thái Truyện</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý và theo dõi tác phẩm của bạn
        </p>
      </div>

      {/* Trạng thái A: Chưa có truyện hoặc đã hoàn thành */}
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
              <Button onClick={() => onNavigate("author-create-story")}>
                <Plus className="h-4 w-4 mr-2" />
                Tạo Truyện Mới
              </Button>
            </div>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}

      {/* Trạng thái B: Đã có 1 truyện đang viết */}
      {hasActiveStory && (
        <>
          {/* Alert về giới hạn 1 truyện */}
          <Alert>
            <AlertCircle className="h-4 w-4 " />
            <AlertTitle>
              {" "}
              <strong>Quy định của ToraNovel</strong>
            </AlertTitle>
            <AlertDescription>
              Bạn đang sáng tác truyện: <strong>{activeStory.title}</strong>
              Theo quy định của ToraNovel, bạn chỉ có thể tạo truyện mới sau khi
              hoàn thành tác phẩm hiện tại.
            </AlertDescription>
          </Alert>

          {/* Bảng hiển thị truyện đang viết */}
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

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Thể loại
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {activeStory.tags && activeStory.tags.length > 0 ? (
                            activeStory.tags.map((tag: Tag) => (
                              <Badge key={tag.tagId} variant="secondary">
                                {tag.tagName}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              -
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Trạng thái
                        </p>
                        {getStatusBadge(activeStory.status)}
                      </div>

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

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
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

      {/* Danh sách truyện đã bị từ chối */}
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
                        {story.aiScore !== undefined && (
                          <p className="text-sm text-destructive">
                            Điểm AI: {story.aiScore.toFixed(2)}
                          </p>
                        )}
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

      {/* Danh sách truyện đã hoàn thành */}
      {stories.filter((s) => s.status === "completed").length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Truyện đã hoàn thành</CardTitle>
            <CardDescription>Các tác phẩm đã hoàn tất của bạn</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
                        <p className="text-sm text-muted-foreground">
                          Hoàn thành:{" "}
                          {new Date(story.updatedAt).toLocaleDateString(
                            "vi-VN"
                          )}
                        </p>
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
