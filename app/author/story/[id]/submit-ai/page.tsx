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
import { Loader2, ArrowLeft, Sparkles, Info, BookOpen } from "lucide-react";
import { storyService } from "@/services/storyService"; // Chỉ import service
import type { Story } from "@/services/apiTypes"; // Import Story từ apiTypes
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
export default function SubmitAIPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;

  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      // Sửa: dùng getStoryDetails thay vì getStoryById
      const data = await storyService.getStoryDetails(storyId);
      setStory(data);
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

  const handleSubmitAI = async () => {
    setIsSubmitting(true);
    try {
      // Sửa: dùng submitStoryForReview thay vì submitForAIScoring
      await storyService.submitStoryForReview(storyId);
      // Navigate to result page
      router.push(`/author/story/${storyId}/ai-result`);
      // } catch (error) {
      //   console.error("Error submitting to AI:", error);
      //   setIsSubmitting(false);
      // }
    } catch (error: any) {
      // --- DÙNG HELPER ---
      handleApiError(error, "Gửi phân tích thất bại. Vui lòng thử lại.");
      setIsSubmitting(false); // Tắt loading khi lỗi
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
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
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
      <Card className="bg-card border-2 shadow-sm overflow-hidden">
        {/* CardHeader mới với Icon được thiết kế lại */}
        <CardHeader className="bg-muted/30 border-b py-5 px-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 shadow-sm border border-primary/20">
              <Info className="h-5 w-5 text-primary" />
            </div>

            <div className="flex flex-col">
              <CardTitle className="text-xl font-bold leading-none text-primary">
                Thông tin truyện
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1.5 font-medium uppercase tracking-wider">
                Xem lại nội dung lần cuối trước khi phân tích
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Thay đổi grid-cols từ 2 thành 3 trên màn hình desktop */}
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* CỘT TRÁI: ẢNH BÌA - Cố định kích thước để nhìn chuyên nghiệp */}
            <div className="w-full md:w-48 flex-shrink-0">
              <div className="aspect-[2/3] rounded-xl overflow-hidden border-2 border-primary/10 shadow-md bg-slate-100 group">
                {story.coverUrl ? (
                  <img
                    src={story.coverUrl}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    alt="Cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
                    No Cover
                  </div>
                )}
              </div>
            </div>

            {/* CỘT PHẢI: CHI TIẾT TRUYỆN - Xếp chồng dọc */}
            <div className="flex-1 space-y-6">
              {/* 1. Tên truyện */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Tên truyện
                </p>
                <h2 className="font-bold text-2xl leading-tight text-primary">
                  {story.title}
                </h2>
              </div>

              {/* Hàng ngang phụ cho Thể loại và Ngôn ngữ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* 2. Thể loại */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Thể loại
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {story.tags && story.tags.length > 0 ? (
                      story.tags.map((tag) => (
                        <Badge
                          key={tag.tagId}
                          variant="outline"
                          className="bg-primary/5 border-primary/20 text-[10px] px-3 py-0.5 font-medium"
                        >
                          {tag.tagName}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        Chưa có thẻ
                      </span>
                    )}
                  </div>
                </div>

                {/* 3. Ngôn ngữ */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Ngôn ngữ
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="font-bold text-[11px] px-3"
                    >
                      {story.languageCode === "vi-VN" && "Tiếng Việt"}
                      {story.languageCode === "en-US" && "English"}
                      {story.languageCode === "zh-CN" && "中文 (Chinese)"}
                      {story.languageCode === "ja-JP" && "日本語 (Japanese)"}
                      {!["vi-VN", "en-US", "zh-CN", "ja-JP"].includes(
                        story.languageCode
                      ) && story.languageCode}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded border border-border/50">
                      {story.languageCode}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-dashed">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Mô tả ngắn
            </p>
            <p className="text-sm leading-relaxed text-foreground/90  whitespace-pre-wrap">
              "{story.description}"
            </p>
          </div>

          <div className="pt-4 border-t border-dashed">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Dàn ý cốt truyện
            </p>
            <div className="bg-muted/30 p-4 rounded-lg border border-border">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {story.outline}
              </p>
            </div>
          </div>
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
                  <strong>Điểm &gt; 7:</strong> Tự động xuất bản, bạn có thể
                  đăng chương ngay
                </li>
                <li>
                  <strong>Điểm 5 - 7:</strong> Gửi ContentMod xem xét thủ công
                  (2-5 ngày)
                </li>
                <li>
                  <strong>Điểm &lt; 5:</strong> Từ chối truyện cần tạo và gửi
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
