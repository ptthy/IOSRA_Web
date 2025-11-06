//app/author/story/[id]/submit-ai/page.tsx
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
import { Loader2, ArrowLeft, Sparkles, Info } from "lucide-react";
import { storyService } from "@/services/storyService"; // Chỉ import service
import type { Story } from "@/services/apiTypes"; // Import Story từ apiTypes
import { Badge } from "@/components/ui/badge";

export default function SubmitAIPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;

  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmitAI = async () => {
    setIsSubmitting(true);
    try {
      // Sửa: dùng submitStoryForReview thay vì submitForAIScoring
      await storyService.submitStoryForReview(storyId);
      // Navigate to result page
      router.push(`/author/story/${storyId}/ai-result`);
    } catch (error) {
      console.error("Error submitting to AI:", error);
      setIsSubmitting(false);
    }
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

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push("/author/overview")}
        disabled={isSubmitting}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Quay lại Dashboard
      </Button>

      {/* Header */}
      <div>
        <h1 className="text-2xl mb-2">Gửi AI Chấm Điểm</h1>
        <p className="text-sm text-muted-foreground">
          Bước 2: Phân tích nội dung tự động
        </p>
      </div>

      {/* Story Info - Read Only */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">Thông tin truyện</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Tên truyện</p>
            <p>{story.title}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Mô tả</p>
            <p className="text-sm">{story.description}</p>
          </div>
          {story.tags && story.tags.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Thể loại</p>
              <div className="flex gap-2">
                {story.tags.map((tag) => (
                  <Badge key={tag.tagId} variant="secondary">
                    {tag.tagName}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main AI Submit Card */}
      <Card className="border-primary/30">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle>Bước 2: Gửi AI Phân tích Nội dung</CardTitle>
              <CardDescription className="mt-2">
                Truyện của bạn sẽ được AI phân tích về nội dung và cấu trúc.
                Điểm số sẽ quyết định truyện được xuất bản ngay, cần ContentMod
                duyệt, hay bị từ chối.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Info Box */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Quy trình chấm điểm:</strong>
              </p>
              <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
                <li>
                  <strong>Điểm &gt; 0.7:</strong> Tự động xuất bản, bạn có thể
                  đăng chương ngay
                </li>
                <li>
                  <strong>Điểm 0.5 - 0.7:</strong> Gửi ContentMod xem xét thủ
                  công (2-5 ngày)
                </li>
                <li>
                  <strong>Điểm &lt; 0.5:</strong> Từ chối truyện cần tạo và gửi
                  lại truyện mới
                </li>
              </ul>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmitAI}
            disabled={isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Đang phân tích...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Bắt đầu Phân tích
              </>
            )}
          </Button>

          <p className="text-sm text-center text-muted-foreground">
            Quá trình phân tích thường mất từ 30 giây đến 2 phút
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
