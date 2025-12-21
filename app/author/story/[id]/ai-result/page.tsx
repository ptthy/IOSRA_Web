// app/author/story/[id]/ai-result/page.tsx
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
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import { storyService } from "@/services/storyService";
import type { Story } from "@/services/apiTypes";
import { AiModerationReport } from "@/components/AiModerationReport";

// --- HELPERS ---
const extractVietnameseFeedback = (
  feedback: string | null | undefined
): string | null => {
  if (!feedback) return null;
  const vietnameseMarkers = ["Tiếng việt:", "Tiếng Việt:"];
  let foundIndex = -1;
  let markerLength = 0;
  for (const marker of vietnameseMarkers) {
    const index = feedback.indexOf(marker);
    if (index !== -1) {
      foundIndex = index;
      markerLength = marker.length;
      break;
    }
  }
  if (foundIndex !== -1)
    return feedback.substring(foundIndex + markerLength).trim();
  if (feedback.includes("English:")) return null;
  return feedback;
};

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
      const data = await storyService.getStoryDetails(storyId);
      setStory(data);
    } catch (error) {
      console.error("Error loading story:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  if (!story)
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground mb-4">
          Không tìm thấy thông tin kết quả đánh giá.
        </p>
        <Button onClick={() => router.push("/author/overview")}>
          Quay lại Dashboard
        </Button>
      </div>
    );

  const aiScore = story.aiScore ?? 0;
  const isApproved =
    story.status === "published" || story.status === "completed";
  const isRejected =
    story.status === "rejected" ||
    (aiScore < 5 && story.status !== "published");
  const isPending = !isApproved && !isRejected;
  const shortResult = story.aiResult || (aiScore >= 5 ? "Đạt" : "Không đạt");
  const displayFeedback = extractVietnameseFeedback(
    story.aiFeedback || story.aiMessage
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 px-4 md:px-0">
      <div className="border-b pb-4">
        <h1 className="text-3xl mb-2 font-bold tracking-tight">
          BÁO CÁO KIỂM DUYỆT CHI TIẾT
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Tác phẩm:{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {story.title}
          </span>
        </p>
      </div>

      {isApproved && (
        <StatusCard
          type="emerald"
          icon={
            <CheckCheck className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          }
          title="Tác phẩm đã được phê duyệt"
          description="Truyện của bạn đã vượt qua hệ thống kiểm duyệt AI và được xuất bản."
          story={story}
          aiScore={aiScore}
          shortResult={shortResult}
          displayFeedback={displayFeedback}
        />
      )}

      {isRejected && (
        <StatusCard
          type="red"
          icon={
            <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
          }
          title="Tác phẩm bị từ chối"
          description="Nội dung vi phạm tiêu chuẩn cộng đồng hoặc không đạt điểm chất lượng tối thiểu."
          story={story}
          aiScore={aiScore}
          shortResult={shortResult}
          displayFeedback={displayFeedback}
        />
      )}

      {isPending && (
        <StatusCard
          type="amber"
          icon={
            <Clock className="h-10 w-10 text-amber-600 dark:text-amber-400" />
          }
          title="Đang chờ xét duyệt thủ công"
          description="Hệ thống cần thêm sự xem xét từ đội ngũ kiểm duyệt viên."
          story={story}
          aiScore={aiScore}
          shortResult={shortResult}
          displayFeedback={displayFeedback}
        />
      )}

      {story.aiViolations && story.aiViolations.length > 0 && (
        <div className="mt-8">
          <AiModerationReport
            aiViolations={story.aiViolations}
            contentType="truyện"
            hideFeedback={true} // THÊM DÒNG NÀY ĐỂ ẨN PHẦN FEEDBACK
          />
        </div>
      )}

      <div className="flex justify-between items-center pt-6">
        <Button
          onClick={() => router.push("/author/overview")}
          variant="ghost"
          className="dark:text-slate-300"
        >
          Quay lại Dashboard
        </Button>
        {isApproved && (
          <Button
            onClick={() => router.push(`/author/story/${storyId}/chapters`)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
          >
            Quản lý Chương <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function StatusCard({
  type,
  icon,
  title,
  description,
  story,
  aiScore,
  shortResult,
  displayFeedback,
}: any) {
  const configs = {
    emerald: {
      border: "border-emerald-500/40 dark:border-emerald-500/20",
      bgHeader: "bg-emerald-50/50 dark:bg-emerald-950/30",
      bgContent: "bg-white dark:bg-slate-900/50",
      accent: "text-emerald-600 dark:text-emerald-400",
    },
    red: {
      border: "border-red-500/40 dark:border-red-500/20",
      bgHeader: "bg-red-50/50 dark:bg-red-950/30",
      bgContent: "bg-white dark:bg-slate-900/50",
      accent: "text-red-600 dark:text-red-400",
    },
    amber: {
      border: "border-amber-500/40 dark:border-amber-500/20",
      bgHeader: "bg-amber-50/50 dark:bg-amber-950/30",
      bgContent: "bg-white dark:bg-slate-900/50",
      accent: "text-amber-600 dark:text-amber-400",
    },
  }[type as "emerald" | "red" | "amber"];

  return (
    <Card
      className={`border-2 shadow-lg overflow-hidden ${configs.border} dark:bg-slate-900`}
    >
      <CardHeader
        className={`flex flex-row items-center gap-6 py-8 border-b ${configs.bgHeader}`}
      >
        <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-inner">
          {icon}
        </div>
        <div className="space-y-1">
          <CardTitle className="text-2xl font-bold dark:text-slate-100">
            {title}
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400 text-base">
            {description}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className={`p-8 ${configs.bgContent}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch">
          {/* CỘT AI */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-2 font-bold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-widest">
              <Quote className="w-4 h-4" /> Đánh giá từ hệ thống AI
            </div>
            <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="p-6 h-[130px] flex flex-col justify-center border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-baseline gap-2">
                  <span className={`text-6xl font-black ${configs.accent}`}>
                    {aiScore.toFixed(2)}
                  </span>
                  <span className="text-slate-400 font-medium text-xl">
                    / 10.00
                  </span>
                </div>
                {/* <div className="text-sm font-bold mt-2 text-slate-600 dark:text-slate-400">
                  TRẠNG THÁI:{" "}
                  <span className="text-slate-900 dark:text-slate-100 uppercase tracking-tighter">
                    {shortResult}
                  </span>
                </div> */}
              </div>
              <div className="p-6 flex-1 bg-white/50 dark:bg-transparent">
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
                  "{displayFeedback || "Không có nhận xét chi tiết bổ sung."}"
                </p>
              </div>
            </div>
          </div>

          {/* CỘT MODERATOR */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-2 font-bold text-slate-500 dark:text-slate-400 uppercase text-xs tracking-widest">
              <UserCheck className="w-4 h-4" /> Phê duyệt thủ công
            </div>
            <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="p-6 h-[130px] flex flex-col justify-center border-b border-slate-200 dark:border-slate-700">
                <div className="text-xs font-bold text-slate-400 uppercase mb-1">
                  Trạng thái duyệt
                </div>
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {story.moderatorStatus || "Không có"}
                </div>
              </div>
              <div className="p-6 flex-1 bg-white/50 dark:bg-transparent">
                <div className="text-xs font-bold text-slate-400 uppercase mb-2">
                  Ghi chú từ kiểm duyệt viên
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                  {story.moderatorNote ||
                    "Không có ghi chú cụ thể nào từ Content Mod đến bạn."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
