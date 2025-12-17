// components/payment/VoiceTopupModal.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Sparkles,
  X,
  AudioWaveform,
  Zap,
  Mic,
  Gem,
} from "lucide-react";
import { toast } from "sonner";

// Import services
import {
  voiceChapterService,
  PricingRule,
} from "@/services/voiceChapterService";
import { authorRevenueService } from "@/services/authorRevenueService";

interface VoiceTopupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VoiceTopupModal({ isOpen, onClose }: VoiceTopupModalProps) {
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [rules, summaryRes] = await Promise.all([
        voiceChapterService.getPricingRules(),
        authorRevenueService.getSummary(),
      ]);

      setPricingRules(rules || []);

      if (summaryRes.data) {
        setBalance(summaryRes.data.revenueBalance || 0);
      }
    } catch (error) {
      console.error("Lỗi tải dữ liệu bảng giá:", error);
      toast.error("Không thể tải thông tin bảng giá.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!w-[95vw] !max-w-5xl h-[85vh] p-0 overflow-hidden bg-card rounded-xl border shadow-2xl flex flex-col [&>button]:hidden fixed left-[50%] -translate-x-1/2 top-[50%] -translate-y-1/2 duration-200">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="!flex items-center justify-center absolute top-4 right-4 z-50 p-2 rounded-full transition-all duration-200 bg-white hover:bg-violet-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-500 hover:text-violet-500 dark:text-white shadow-lg shadow-black/10 border-2 border-gray-100 dark:border-zinc-700 hover:scale-110 active:scale-95 cursor-pointer group h-9 w-9"
        >
          <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300 stroke-[2.5px]" />
        </button>

        <div className="flex h-full w-full">
          {/* --- CỘT TRÁI: ĐÃ CHỈNH LẠI WIDTH VÀ TEXT --- */}
          {/* w-[320px] là kích thước chuẩn, text nhỏ lại để thoáng hơn */}
          <div className="w-[320px] flex-shrink-0 bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#6B8DD6] p-8 text-white flex flex-col relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-300/20 rounded-full blur-[60px] pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-300/20 rounded-full blur-[50px] pointer-events-none -translate-x-1/2 translate-y-1/2"></div>

            <div className="relative z-10 flex flex-col h-full gap-6 justify-center">
              <div>
                <div className="inline-flex items-center gap-2 mb-4 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20 shadow-sm">
                  <AudioWaveform className="h-4 w-4 text-purple-200" />
                  <span className="text-xs font-bold uppercase tracking-widest text-white">
                    AI Voice Studio
                  </span>
                </div>
                {/* Giảm size chữ tiêu đề xuống text-3xl cho vừa vặn */}
                <h2 className="text-3xl font-bold mb-3 leading-tight">
                  Bảng Giá <br /> Dịch Vụ
                </h2>
                <p className="text-white/90 text-sm mb-4 leading-relaxed opacity-90">
                  Chi phí tạo Audio được tính tự động dựa trên độ dài chương
                  truyện của bạn.
                </p>
              </div>

              <div className="flex-1 flex flex-col justify-center mt-2">
                <div className="bg-white/10 backdrop-blur-xl rounded-xl p-5 border border-white/20 shadow-lg">
                  <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    Quyền lợi
                  </h3>
                  <ul className="space-y-4 mb-2">
                    {[
                      { text: "Chi phí minh bạch", icon: Zap },
                      { text: "Giọng đọc AI cao cấp", icon: Mic },
                      { text: "Tạo 1 lần, dùng mãi mãi", icon: AudioWaveform },
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm">
                        <div className="bg-indigo-500/30 p-2 rounded-lg shrink-0">
                          <item.icon className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-medium text-white/95">
                          {item.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="text-xs text-white/50 text-center mt-auto pt-4">
                Powered by IOSRA AI
              </div>
            </div>
          </div>

          {/* --- CỘT PHẢI: BẢNG GIÁ --- */}
          <div className="flex-1 min-w-0 bg-white dark:bg-card flex flex-col h-full">
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-8 py-6 border-b border-border/50">
              <div className="pr-8">
                {/* Giảm tiêu đề phải xuống text-2xl */}
                <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  Định mức chi phí
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Áp dụng cho việc tạo Audio AI theo chương.
                </DialogDescription>
              </div>

              {/* Badge Số dư nhỏ gọn hơn */}
              <div className="bg-indigo-50 dark:bg-muted px-4 py-2 rounded-lg border border-indigo-100 dark:border-indigo-900 shadow-sm flex flex-col items-end whitespace-nowrap mr-6">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">
                  Số dư ví
                </p>
                <div className="text-xl font-bold text-blue-600 flex items-center gap-2">
                  {balance.toLocaleString()}
                  <Gem className="h-5 w-5 fill-blue-600" />
                </div>
              </div>
            </div>

            {/* Content Table */}
            <div className="flex-1 px-8 py-6 flex flex-col">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-3" />
                  <p className="text-muted-foreground text-sm">
                    Đang tải dữ liệu...
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-5 h-full">
                  <div className="rounded-lg border overflow-hidden shadow-sm">
                    <Table>
                      <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                        <TableRow className="h-10">
                          {/* Font chữ bảng giảm về text-sm hoặc text-base */}
                          <TableHead className="w-[45%] text-slate-900 dark:text-slate-100 font-semibold text-sm pl-6">
                            Độ dài chương (Ký tự)
                          </TableHead>
                          <TableHead className="text-right text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                            Phí tạo (Dias)
                          </TableHead>
                          <TableHead className="text-right text-green-600 dark:text-green-400 font-bold text-sm pr-6">
                            Giá bán (Dias)
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pricingRules.map((rule, index) => (
                          <TableRow
                            key={index}
                            className="hover:bg-slate-50/50 transition-colors h-12"
                          >
                            <TableCell className="font-medium text-sm pl-6">
                              {rule.minCharCount.toLocaleString()}
                              {" - "}
                              {rule.maxCharCount
                                ? rule.maxCharCount.toLocaleString()
                                : "Trở lên"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5 text-sm font-semibold">
                                {rule.generationCostDias}
                                <Gem className="h-4 w-4 text-blue-500 fill-blue-500 opacity-80" />
                              </div>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <div className="flex items-center justify-end gap-1.5 text-sm font-semibold">
                                {rule.sellingPriceDias}
                                <Gem className="h-4 w-4 text-blue-500 fill-blue-500 opacity-80" />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {pricingRules.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={3}
                              className="text-center h-32 text-muted-foreground text-sm"
                            >
                              Không có dữ liệu bảng giá.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Footer note */}
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-200 flex items-start gap-3 mt-auto mb-2">
                    <Zap className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="leading-snug">
                      <strong>Lưu ý:</strong> Phí tạo được tính dựa trên mỗi
                      giọng đọc. Nếu bạn chọn nhiều giọng đọc cho cùng một
                      chương, phí sẽ được nhân lên tương ứng.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
