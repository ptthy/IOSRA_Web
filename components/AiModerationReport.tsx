// components/AiModerationReport.tsx
import React from "react";
import {
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  Fingerprint,
  Languages,
  AlertTriangle,
  FileWarning,
  SearchCode,
  PenTool,
  BookOpen,
  Link,
  Skull,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AiViolation } from "@/services/apiTypes";

interface AiModerationReportProps {
  aiFeedback?: string | null;
  aiViolations?: AiViolation[] | null;
  contentType?: "truyện" | "chương";
}

const getViolationStyle = (label: string) => {
  const styles: Record<string, { labelVn: string; icon: any; color: string }> =
    {
      wrong_language: {
        labelVn: "Ngôn ngữ không hợp lệ",
        icon: Languages,
        color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20",
      },
      sexual_explicit: {
        labelVn: "Nội dung nhạy cảm/NSFW",
        icon: AlertTriangle,
        color: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20",
      },
      violent_gore: {
        labelVn: "Bạo lực & Máu me",
        icon: Skull,
        color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20",
      },
      spam_repetition: {
        labelVn: "Spam & Lặp từ ngữ",
        icon: Fingerprint,
        color:
          "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20",
      },
      url_redirect: {
        labelVn: "Liên kết ngoài/Quảng cáo",
        icon: Link,
        color:
          "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20",
      },
      grammar_spelling: {
        labelVn: "Lỗi trình bày/Chính tả",
        icon: PenTool,
        color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20",
      },
      weak_prose: {
        labelVn: "Văn phong cần cải thiện",
        icon: BookOpen,
        color:
          "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950/20",
      },
      inconsistent_content: {
        labelVn: "Nội dung không đồng nhất",
        icon: FileWarning,
        color:
          "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20",
      },
    };
  return (
    styles[label] || {
      labelVn: "Vi phạm khác",
      icon: ShieldAlert,
      color: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/40",
    }
  );
};

const extractVietnameseFeedback = (feedback: string) => {
  if (!feedback) return "";
  const parts = feedback.split(/Tiếng việt:|Tiếng Việt:/i);
  return parts.length > 1 ? parts[1].trim() : feedback.trim();
};

export const AiModerationReport: React.FC<AiModerationReportProps> = ({
  aiFeedback,
  aiViolations,
  contentType = "nội dung",
}) => {
  return (
    <div className="pt-6 border-t mt-6 space-y-8">
      {/* KHỐI 1: NHẬN XÉT TỔNG QUÁT - ĐÃ CẬP NHẬT UI GIỐNG TÓM TẮT CHƯƠNG */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-primary">
          <FileText className="h-4 w-4" />
          <h3 className="text-sm font-bold uppercase tracking-wider">
            Phản hồi tổng quát từ AI
          </h3>
        </div>

        {/* Container được đổi từ Card nét đứt sang div khối màu giống Summary */}
        <div className="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-sm leading-relaxed whitespace-pre-wrap text-gray-800 dark:text-gray-200">
            {aiFeedback ? (
              extractVietnameseFeedback(aiFeedback)
            ) : (
              <span className="text-muted-foreground italic">
                Không có nhận xét chi tiết cho {contentType} này.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* KHỐI 2: CHI TIẾT VI PHẠM */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-500">
            <ShieldAlert className="h-4 w-4" />
            <h3 className="text-sm font-bold uppercase tracking-wider">
              Các vi phạm phát hiện
            </h3>
          </div>
        </div>

        {aiViolations && aiViolations.length > 0 ? (
          <div className="grid gap-4">
            {aiViolations.map((v, idx) => {
              const style = getViolationStyle(v.label);
              const Icon = style.icon;
              return (
                <div
                  key={idx}
                  className={`rounded-xl border p-4 shadow-sm transition-all ${style.color}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-white/60 dark:bg-black/20">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-bold text-sm leading-none">
                          {style.labelVn}
                        </p>
                        <p className="text-[10px] mt-1 font-mono opacity-60 uppercase tracking-tighter">
                          {v.label}
                        </p>
                      </div>
                    </div>
                    {v.penalty !== undefined && (
                      <Badge
                        variant="destructive"
                        className="font-mono text-xs"
                      >
                        -{Math.abs(v.penalty).toFixed(1)} điểm
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase opacity-50 flex items-center gap-1">
                      <SearchCode className="h-3 w-3" /> Mẫu nội dung vi phạm:
                    </p>
                    <div className="grid gap-1.5">
                      {v.evidence.map((snippet, sIdx) => (
                        <div
                          key={sIdx}
                          className="bg-white/50 dark:bg-black/30 p-2.5 rounded border border-black/5 text-xs font-mono italic break-words shadow-inner leading-normal"
                        >
                          "{snippet}"
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* TRẠNG THÁI KHÔNG VI PHẠM NỔI BẬT */
          <div className="flex flex-col items-center justify-center py-10 border-2 border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl shadow-sm shadow-emerald-100/50 transition-all">
            <div className="bg-white dark:bg-emerald-900/40 p-3 rounded-full shadow-inner mb-3 border border-emerald-100">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <p className="text-sm text-emerald-700 dark:text-emerald-400 font-bold text-center px-4">
              Tuyệt vời! AI không phát hiện vi phạm chính sách nào.
            </p>
            <p className="text-[10px] text-emerald-600/60 dark:text-emerald-500/60 uppercase tracking-widest mt-1 font-semibold">
              Xác thực bởi AI Moderation
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
