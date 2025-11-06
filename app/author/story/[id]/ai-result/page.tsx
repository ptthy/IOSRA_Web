//app/author/story/[id]/ai-result/page.tsx
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
import { Loader2, CheckCheck, Clock, XCircle, ArrowRight } from "lucide-react";
import { storyService } from "@/services/storyService"; // Chỉ import storyService
import type { Story } from "@/services/apiTypes"; // Import Story từ apiTypes

export default function AIResultPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;

  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStory();
  }, [storyId]);

  const loadStory = async () => {
    setIsLoading(true);
    try {
      // Sửa: dùng getStoryDetails thay vì getStoryById
      const data = await storyService.getStoryDetails(storyId);
      setStory(data);
    } catch (error) {
      console.error("Error loading story:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!story || !story.aiScore) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground mb-4">
          Không tìm thấy kết quả chấm điểm
        </p>
        <Button onClick={() => router.push("/author/overview")}>
          Quay lại Dashboard
        </Button>
      </div>
    );
  }

  // Sửa: Determine state based on status (dùng status chữ thường)
  const isApproved = story.status === "published";
  const isPendingCMod = story.status === "pending";
  const isRejected = story.status === "rejected";

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl mb-2">Kết Quả AI Chấm Điểm</h1>
        <p className="text-sm text-muted-foreground">Truyện: {story.title}</p>
      </div>

      {/* STATE A: APPROVED (Score > 0.7) */}
      {isApproved && (
        <Card className="border-2 border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
                <CheckCheck className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl text-emerald-700 dark:text-emerald-300">
                  Chúc mừng! Truyện của bạn đã được Xuất bản
                </CardTitle>
                <CardDescription className="mt-2 text-emerald-600 dark:text-emerald-400">
                  Truyện đã vượt qua kiểm duyệt AI và được tự động phê duyệt
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Score Box */}
            <div className="p-6 bg-white dark:bg-card rounded-lg border border-emerald-200 dark:border-emerald-800">
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground mb-2">Điểm AI</p>
                <p className="text-6xl text-emerald-600 dark:text-emerald-400">
                  {story.aiScore.toFixed(2)}
                </p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm">
                  <strong className="text-emerald-700 dark:text-emerald-300">
                    Phản hồi AI:
                  </strong>
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {story.aiNote || story.aiMessage}
                </p>
              </div>
            </div>

            {/* CTA */}
            <Button
              onClick={() => router.push(`/author/story/${storyId}/chapters`)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
              size="lg"
            >
              Quản lý Chương
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              Bạn có thể bắt đầu đăng các chương của truyện ngay bây giờ
            </p>
          </CardContent>
        </Card>
      )}

      {/* STATE B: PENDING CMOD (Score 0.5 - 0.7) */}
      {isPendingCMod && (
        <Card className="border-2 border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl text-amber-700 dark:text-amber-300">
                  Truyện của bạn đã được gửi cho ContentMod
                </CardTitle>
                <CardDescription className="mt-2 text-amber-600 dark:text-amber-400">
                  AI phát hiện nội dung cần xem xét thêm
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Score Box */}
            <div className="p-6 bg-white dark:bg-card rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground mb-2">Điểm AI</p>
                <p className="text-6xl text-amber-600 dark:text-amber-400">
                  {story.aiScore.toFixed(2)}
                </p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm">
                  <strong className="text-amber-700 dark:text-amber-300">
                    Phản hồi AI:
                  </strong>
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {story.aiNote || story.aiMessage}
                </p>
              </div>
            </div>

            {/* Info */}
            <div className="p-4 bg-white dark:bg-card rounded-lg border">
              <p className="text-sm">
                <strong>Tiếp theo:</strong>
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                <li>
                  Đội ngũ ContentMod sẽ xem xét truyện trong vòng 2-5 ngày làm
                  việc
                </li>
                <li>Bạn sẽ nhận được thông báo khi có kết quả</li>
                <li>Nếu được duyệt, truyện sẽ tự động xuất bản</li>
              </ul>
            </div>

            {/* CTA */}
            <Button
              onClick={() => router.push("/author/overview")}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Quay lại Dashboard
            </Button>
          </CardContent>
        </Card>
      )}

      {/* STATE C: REJECTED (Score < 0.5) */}
      {isRejected && (
        <Card className="border-2 border-destructive/50 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl text-destructive">
                  Truyện của bạn đã bị Từ chối
                </CardTitle>
                <CardDescription className="mt-2 text-red-600 dark:text-red-400">
                  AI phát hiện nội dung vi phạm nghiêm trọng (restricted {">"}{" "}
                  -0.05)
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Score Box */}
            <div className="p-6 bg-white dark:bg-card rounded-lg border border-destructive">
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground mb-2">Điểm AI</p>
                <p className="text-6xl text-destructive">
                  {story.aiScore.toFixed(2)}
                </p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm">
                  <strong className="text-destructive">Phản hồi AI:</strong>
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {story.aiNote ||
                    story.aiMessage ||
                    "AI phát hiện nội dung vi phạm nghiêm trọng (restricted > -0.05). Từ chối tự động. Vui lòng chỉnh sửa lại."}
                </p>
              </div>
            </div>

            {/* Info */}
            <div className="p-4 bg-white dark:bg-card rounded-lg border border-destructive/50 bg-red-50 dark:bg-red-950/20">
              <p className="text-sm">
                <strong className="text-destructive">
                  Hướng dẫn chỉnh sửa:
                </strong>
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                <li>
                  Kiểm tra và loại bỏ nội dung vi phạm chính sách ToraNovel
                </li>
                <li>Đảm bảo nội dung phù hợp với mọi lứa tuổi</li>
                <li>Sau khi chỉnh sửa, bạn có thể gửi lại để AI đánh giá</li>
              </ul>
            </div>

            {/* CTA - Only Dashboard button */}
            <Button
              onClick={() => router.push("/author/overview")}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Quay lại Dashboard
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              Truyện này sẽ được lưu trong mục "Truyện đã bị từ chối" để bạn
              tham khảo
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
