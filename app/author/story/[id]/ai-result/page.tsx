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
import {
  Loader2,
  CheckCheck,
  Clock,
  XCircle,
  ArrowRight,
  Quote,
} from "lucide-react";
import { storyService } from "@/services/storyService";
import type { Story } from "@/services/apiTypes";
import { toast } from "sonner";
import { AiModerationReport } from "@/components/AiModerationReport";
// --- HELPER FUNCTION ---
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

export default function AIResultPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;

  const [story, setStory] = useState<Story | null>(null);
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
    loadStory();
  }, [storyId]);

  const loadStory = async () => {
    setIsLoading(true);
    try {
      const data = await storyService.getStoryDetails(storyId);
      setStory(data);
      // } catch (error) {
      //   console.error("Error loading story:", error);
      // } finally {
      //   setIsLoading(false);
      // }
    } catch (error: any) {
      console.error("Error loading story:", error);
      // --- DÙNG HELPER ---
      handleApiError(error, "Không thể tải kết quả đánh giá.");
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

  const isApproved = story.status === "published";
  const isPendingCMod = story.status === "pending";
  const isRejected = story.status === "rejected";

  // --- TÁCH RIÊNG 2 PHẦN DỮ LIỆU ---

  // 1. Kết quả ngắn (Vd: "approved")
  // Ưu tiên aiResult, nếu không có thì tìm trong aiNote
  const shortResult = story.aiResult || story.aiNote || "N/A";

  // 2. Nội dung chi tiết (Vd: "Tiếng Việt: Nội dung...")
  // Ưu tiên aiFeedback, nếu không có thì tìm trong aiMessage
  const rawFeedback = story.aiFeedback || story.aiMessage;
  const displayFeedback = extractVietnameseFeedback(rawFeedback);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl mb-2">Kết Quả AI Chấm Điểm</h1>
        <p className="text-sm text-muted-foreground">Truyện: {story.title}</p>
      </div>

      {/* STATE A: APPROVED */}
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
            <div className="p-6 bg-white dark:bg-card rounded-lg border border-emerald-200 dark:border-emerald-800">
              {/* Điểm số */}
              <div className="text-center mb-6">
                <p className="text-sm text-muted-foreground mb-2">Điểm AI</p>
                <p className="text-6xl text-emerald-600 dark:text-emerald-400 font-bold">
                  {story.aiScore.toFixed(2)}
                </p>
              </div>

              <div className="grid gap-4 pt-4 border-t">
                {/* PHẦN 1: Hiển thị trạng thái ngắn (aiResult) */}
                <div className="flex items-center justify-between p-2">
                  <span className="font-semibold text-emerald-800 dark:text-emerald-200">
                    Kết quả AI:
                  </span>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold uppercase tracking-wide border border-emerald-200">
                    {shortResult}
                  </span>
                </div>

                {/* PHẦN 2: Hiển thị phản hồi chi tiết (aiFeedback) */}
                <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-4 rounded-md border border-emerald-100 dark:border-emerald-800/50">
                  <div className="flex items-center gap-2 mb-2 text-emerald-700 dark:text-emerald-300 font-semibold text-sm">
                    <Quote className="w-4 h-4" />
                    Chi tiết đánh giá:
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                    {displayFeedback || "Không có phản hồi chi tiết."}
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => router.push(`/author/story/${storyId}/chapters`)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
              size="lg"
            >
              Quản lý Chương
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* STATE B: PENDING */}
      {isPendingCMod && (
        <Card className="border-2 border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl text-amber-700 dark:text-amber-300">
                  Truyện đang chờ duyệt thủ công
                </CardTitle>
                <CardDescription className="mt-2 text-amber-600 dark:text-amber-400">
                  AI phát hiện nội dung cần xem xét thêm
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="p-6 bg-white dark:bg-card rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="text-center mb-6">
                <p className="text-sm text-muted-foreground mb-2">Điểm AI</p>
                <p className="text-6xl text-amber-600 dark:text-amber-400 font-bold">
                  {story.aiScore.toFixed(2)}
                </p>
              </div>

              <div className="grid gap-4 pt-4 border-t">
                {/* PHẦN 1: aiResult */}
                <div className="flex items-center justify-between p-2">
                  <span className="font-semibold text-amber-800 dark:text-amber-200">
                    Kết quả AI:
                  </span>
                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-bold uppercase tracking-wide border border-amber-200">
                    {shortResult}
                  </span>
                </div>

                {/* PHẦN 2: aiFeedback */}
                <div className="bg-amber-50/50 dark:bg-amber-900/10 p-4 rounded-md border border-amber-100 dark:border-amber-800/50">
                  <div className="flex items-center gap-2 mb-2 text-amber-700 dark:text-amber-300 font-semibold text-sm">
                    <Quote className="w-4 h-4" />
                    Chi tiết đánh giá:
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                    {displayFeedback || "Đang chờ đánh giá chi tiết."}
                  </p>
                </div>
              </div>
            </div>

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
              </ul>
            </div>

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

      {/* STATE C: REJECTED */}
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
                  AI phát hiện nội dung vi phạm nghiêm trọng
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="p-6 bg-white dark:bg-card rounded-lg border border-destructive">
              <div className="text-center mb-6">
                <p className="text-sm text-muted-foreground mb-2">Điểm AI</p>
                <p className="text-6xl text-destructive font-bold">
                  {story.aiScore.toFixed(2)}
                </p>
              </div>

              <div className="grid gap-4 pt-4 border-t">
                {/* PHẦN 1: aiResult */}
                <div className="flex items-center justify-between p-2">
                  <span className="font-semibold text-destructive">
                    Kết quả AI:
                  </span>
                  <span className="px-3 py-1 rounded-full bg-red-100 text-destructive text-sm font-bold uppercase tracking-wide border border-red-200">
                    {shortResult}
                  </span>
                </div>

                {/* PHẦN 2: aiFeedback */}
                <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-md border border-red-100 dark:border-red-800/50">
                  <div className="flex items-center gap-2 mb-2 text-destructive font-semibold text-sm">
                    <Quote className="w-4 h-4" />
                    Chi tiết đánh giá:
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                    {displayFeedback ||
                      "AI phát hiện nội dung vi phạm nghiêm trọng."}
                  </p>
                </div>
              </div>
            </div>

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
      {/* Hiển thị chi tiết vi phạm nếu có */}
      <div className="mt-8">
        <AiModerationReport
          aiFeedback={null} // Truyền null vì feedback tổng quát đã hiện ở trên
          aiViolations={story.aiViolations}
          contentType="truyện"
        />
      </div>
      {/* ------------------- */}
    </div>
  );
}
