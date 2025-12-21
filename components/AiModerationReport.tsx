// components/AiModerationReport.tsx
import React from "react";
import {
  ShieldAlert,
  Languages,
  AlertTriangle,
  Fingerprint,
  Link,
  PenTool,
  BookOpen,
  FileWarning,
  Skull,
  FileText,
  SearchCode,
  CheckCircle2,
  AlertOctagon,
  HeartCrack,
  ShieldX,
  Target,
  HandMetal,
  Hammer,
  UserX,
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
      // Ngôn ngữ
      wrong_language: {
        labelVn: "Ngôn ngữ không hợp lệ",
        icon: Languages,
        color:
          "bg-red-100 text-red-700 border-red-300 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/50",
      },
      // Nội dung người lớn
      sexual_explicit: {
        labelVn: "Nội dung nhạy cảm/18+",
        icon: AlertTriangle,
        color:
          "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/50",
      },
      sexual_minor: {
        labelVn: "Vi phạm an toàn trẻ em",
        icon: ShieldX,
        color:
          "bg-red-200 text-red-900 border-red-400 dark:bg-red-600/30 dark:text-red-300 dark:border-red-500",
      },
      sexual_transaction: {
        labelVn: "Giao dịch tình dục",
        icon: HeartCrack,
        color:
          "bg-rose-200 text-rose-900 border-rose-400 dark:bg-rose-600/30 dark:text-rose-300 dark:border-rose-500",
      },

      // Bạo lực & Cực đoan
      violent_gore: {
        labelVn: "Bạo lực & Máu me",
        icon: Skull,
        color:
          "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/50",
      },
      extremist_rhetoric: {
        labelVn: "Ngôn từ cực đoan",
        icon: ShieldAlert,
        color:
          "bg-red-100 text-red-700 border-red-300 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/50",
      },

      // Spam & Rác
      spam_repetition: {
        labelVn: "Spam & Lặp từ ngữ",
        icon: AlertOctagon,
        color:
          "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/50",
      },
      url_redirect: {
        labelVn: "Liên kết ngoài trái phép",
        icon: Link,
        color:
          "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/50",
      },

      // Chất lượng văn bản
      grammar_spelling: {
        labelVn: "Lỗi chính tả/Trình bày",
        icon: PenTool,
        color:
          "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/50",
      },
      weak_prose: {
        labelVn: "Văn phong yếu/Lặp ý",
        icon: BookOpen,
        color:
          "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-500/20 dark:text-slate-300 dark:border-slate-500/50",
      },
      poor_formatting: {
        labelVn: "Trình bày kém (Wall of text)",
        icon: FileWarning,
        color:
          "bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/50",
      },

      // Dữ liệu cá nhân & Phạm pháp
      personal_data: {
        labelVn: "Lộ thông tin cá nhân",
        icon: UserX,
        color:
          "bg-red-100 text-red-800 border-red-300 dark:bg-red-600/20 dark:text-red-400 dark:border-red-500/50",
      },
      illegal_instruction: {
        labelVn: "Hướng dẫn phi pháp",
        icon: Hammer,
        color:
          "bg-stone-100 text-stone-700 border-stone-300 dark:bg-stone-500/20 dark:text-stone-400 dark:border-stone-500/50",
      },

      // Thù ghét & Quấy rối
      hate_speech: {
        labelVn: "Ngôn từ thù ghét",
        icon: AlertOctagon,
        color:
          "bg-red-100 text-red-700 border-red-300 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/50",
      },
      harassment_targeted: {
        labelVn: "Quấy rối mục tiêu",
        icon: Target,
        color:
          "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/50",
      },
      self_harm_promotion: {
        labelVn: "Tự hại/Tự sát",
        icon: HeartCrack,
        color:
          "bg-red-100 text-red-700 border-red-300 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/50",
      },

      // Đồng nhất nội dung
      inconsistent_content: {
        labelVn: "Nội dung không đồng nhất",
        icon: FileWarning,
        color:
          "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/50",
      },
    };
  return (
    styles[label] || {
      labelVn: "Vi phạm chính sách",
      icon: ShieldAlert,
      color:
        "bg-slate-200 text-slate-800 border-slate-400 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600",
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
    <div className="pt-6 border-t border-border mt-6 space-y-8">
      {/* PHẢN HỒI TỔNG QUÁT */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-primary dark:text-primary-foreground">
          <FileText className="h-5 w-5" />
          <h3 className="text-sm font-bold uppercase tracking-widest">
            Phản hồi tổng quát từ AI
          </h3>
        </div>
        <div className="p-5 bg-blue-100/50 dark:bg-blue-900/40 rounded-xl border-2 border-blue-200 dark:border-blue-700 shadow-sm">
          <div className="text-[15px] leading-relaxed whitespace-pre-wrap text-gray-900 dark:text-gray-100 font-medium">
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

      {/* CHI TIẾT VI PHẠM */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-destructive dark:text-red-400">
          <ShieldAlert className="h-5 w-5" />
          <h3 className="text-sm font-bold uppercase tracking-widest">
            Chi tiết các vi phạm
          </h3>
        </div>

        {aiViolations && aiViolations.length > 0 ? (
          <div className="grid gap-5">
            {aiViolations.map((v, idx) => {
              const style = getViolationStyle(v.word);
              const Icon = style.icon;
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border-2 p-5 shadow-md transition-all ${style.color}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-xl bg-white/80 dark:bg-black/40 shadow-sm">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-bold text-base uppercase tracking-tight">
                          {style.labelVn}
                        </p>
                        <p className="text-[10px] font-mono opacity-80 font-bold uppercase">
                          TAG: {v.word}
                        </p>
                      </div>
                    </div>

                    {/* KHỐI HIỂN THỊ COUNT VÀ PENALTY */}
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge
                        variant="outline"
                        className="border-current px-3 py-1 font-bold text-sm bg-white/20"
                      >
                        {v.count} lần
                      </Badge>
                      {v.penalty !== undefined &&
                        v.penalty !== null &&
                        v.penalty !== 0 && (
                          <Badge className="bg-red-600 dark:bg-red-700 text-white border-none px-4 py-1.5 text-[12px] font-bold tracking-tight shadow-md uppercase">
                            {v.penalty > 0
                              ? `-${v.penalty.toFixed(1)}`
                              : v.penalty.toFixed(1)}
                            <span className="ml-1.5">ĐIỂM</span>{" "}
                          </Badge>
                        )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[11px] font-bold uppercase opacity-70 flex items-center gap-1.5">
                      <SearchCode className="h-4 w-4" /> BẰNG CHỨNG VI PHẠM:
                    </p>
                    <div className="grid gap-2">
                      {v.samples.map((snippet, sIdx) => (
                        <div
                          key={sIdx}
                          className="bg-white/40 dark:bg-black/40 p-3.5 rounded-xl border border-black/5 dark:border-white/10 text-[13px] font-medium italic break-words leading-relaxed shadow-inner"
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
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-emerald-400 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-3xl">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-3" />
            <p className="text-base text-emerald-700 dark:text-emerald-400 font-bold">
              Nội dung an toàn - Không phát hiện vi phạm
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
