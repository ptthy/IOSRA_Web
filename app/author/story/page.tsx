//app/author/story/page.tsx
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
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    loadStories();
  }, []);

  const loadStories = async () => {
    setIsLoading(true);
    try {
      const data = await storyService.getAllStories();
      setStories(data);
      // } catch (error) {
      //   console.error("Error loading stories:", error);
      // } finally {
      //   setIsLoading(false);
      // }
    } catch (error: any) {
      // --- DÙNG HELPER ---
      handleApiError(error, "Không thể tải danh sách truyện.");
    } finally {
      setIsLoading(false);
    }
  };

  const onNavigate = (page: string, params?: any) => {
    const routes: Record<string, string> = {
      "author-dashboard": "/author/overview",
      "author-create-story": "/author/create-story",
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

  const activeStory = stories.find(
    (s) =>
      s.status === "draft" ||
      s.status === "pending" ||
      s.status === "published" ||
      s.status === "hidden"
  );
  const hasActiveStory = !!activeStory;

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
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-[var(--primary)]">
          Quản lý Truyện
        </h2>
        <p className="text-sm text-muted-foreground">
          Danh sách tất cả các truyện của bạn
        </p>
      </div>

      {/* Alert về giới hạn 1 truyện nếu có truyện đang viết */}
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
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Bạn có thể tạo truyện mới sau khi hoàn thành truyện hiện tại.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danh sách truyện */}
      {stories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Danh sách truyện</CardTitle>
            <CardDescription>Tất cả các truyện bạn đã tạo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stories.map((story) => (
                <div
                  key={story.storyId}
                  className="border rounded-lg overflow-hidden"
                >
                  <div className="flex items-start gap-4 p-4">
                    {/* Cover Image */}
                    <div className="shrink-0">
                      <div className="w-16 h-24 sm:w-20 sm:h-28 bg-muted rounded-lg flex items-center justify-center">
                        {story.coverUrl ? (
                          <img
                            src={story.coverUrl}
                            alt={story.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <BookOpen className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <h3 className="font-semibold">{story.title}</h3>
                      <div className="flex flex-wrap items-center gap-2">
                        {story.tags && story.tags.length > 0 ? (
                          <Badge variant="secondary">
                            {story.tags[0].tagName}
                          </Badge>
                        ) : null}
                        {getStatusBadge(story.status)}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {story.description}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Cập nhật:{" "}
                        {new Date(story.updatedAt).toLocaleDateString("vi-VN")}
                      </p>
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
