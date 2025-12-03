// components/payment/VoiceTopupModal.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Sparkles,
  X,
  Mic,
  AudioWaveform,
  CreditCard,
  Zap,
  Speech,
  Feather,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  voiceTopupPaymentService,
  VoicePricingPackage,
} from "@/services/voiceTopupPaymentService";
import { profileService } from "@/services/profileService";

// Định nghĩa trước Theme để map động
const THEMES = {
  BASIC: {
    border: "border-slate-400 dark:border-slate-600",
    bg: "bg-slate-50 dark:bg-slate-950/30",
    iconBg: "bg-slate-200 dark:bg-slate-800",
    iconColor: "text-slate-600 dark:text-slate-400",
    btn: "bg-slate-700 hover:bg-slate-800 text-white",
    badge: "bg-slate-100 text-slate-700",
    icon: Feather,
    label: "Cơ bản",
  },
  PRO: {
    border: "border-violet-500 dark:border-violet-600",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    iconBg: "bg-violet-100 dark:bg-violet-900/50",
    iconColor: "text-violet-600 dark:text-violet-400",
    btn: "bg-violet-600 hover:bg-violet-700 text-white",
    badge:
      "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
    icon: TrendingUp,
    label: "Siêu Lời",
  },
};

interface VoiceTopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTextBalance?: number;
}

export function VoiceTopupModal({
  isOpen,
  onClose,
  currentTextBalance = 0,
}: VoiceTopupModalProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [realVoiceBalance, setRealVoiceBalance] = useState(currentTextBalance);

  // State lưu danh sách gói lấy từ API
  const [packages, setPackages] = useState<VoicePricingPackage[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);

  // --- 1. Lấy số dư ví (Giữ nguyên logic cũ) ---
  useEffect(() => {
    if (isOpen) {
      const fetchWallet = async () => {
        try {
          const res = await profileService.getWallet();
          if (res.data) {
            setRealVoiceBalance(res.data.voiceCharBalance || 0);
          }
        } catch (error) {
          console.error("Lỗi cập nhật số dư voice:", error);
        }
      };
      fetchWallet();
    }
  }, [isOpen]);

  // --- 2. LOGIC MỚI: Gọi API lấy gói cước ---
  useEffect(() => {
    if (isOpen) {
      const fetchPricing = async () => {
        setIsLoadingPackages(true);
        try {
          const res = await voiceTopupPaymentService.getPricingPackages();
          if (res.data && Array.isArray(res.data)) {
            // Sắp xếp gói theo giá tăng dần để hiển thị hợp lý
            const sortedPackages = res.data.sort(
              (a, b) => a.amountVnd - b.amountVnd
            );
            setPackages(sortedPackages);
          }
        } catch (error) {
          console.error("Lỗi lấy bảng giá:", error);
          toast.error("Không thể tải bảng giá gói cước.");
        } finally {
          setIsLoadingPackages(false);
        }
      };
      fetchPricing();
    }
  }, [isOpen]);

  const handleTopUp = async (amountVND: number, pkgId: string) => {
    setProcessingId(pkgId);
    try {
      // Truyền thêm pricingId vào API tạo link
      const response = await voiceTopupPaymentService.createPaymentLink({
        amount: amountVND,
        pricingId: pkgId,
      });

      if (response.data?.checkoutUrl) {
        if (response.data.transactionId) {
          localStorage.setItem(
            "pendingVoiceTransactionId",
            response.data.transactionId.toString()
          );
        }
        window.location.href = response.data.checkoutUrl;
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Lỗi tạo giao dịch Voice");
      setProcessingId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!w-[95vw] !max-w-none h-[90vh] p-0 overflow-hidden bg-card rounded-xl border shadow-2xl flex flex-col [&>button]:hidden fixed left-[50%] -translate-x-1/2 top-[2%] sm:top-[5%] translate-y-0 duration-200">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="!flex items-center justify-center absolute top-4 right-4 z-50 p-2 rounded-full transition-all duration-200 bg-white hover:bg-violet-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-500 hover:text-violet-500 dark:text-white shadow-lg shadow-black/10 border-2 border-gray-100 dark:border-zinc-700 hover:scale-110 active:scale-95 cursor-pointer group h-10 w-10"
        >
          <X className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300 stroke-[3px]" />
        </button>

        <div className="flex h-full w-full">
          {/* --- CỘT TRÁI: GIỚI THIỆU (Giữ nguyên) --- */}
          <div className="w-[350px] flex-shrink-0 bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#6B8DD6] p-6 text-white flex flex-col overflow-y-auto scrollbar-hide">
            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-300/20 rounded-full blur-[50px] pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-300/20 rounded-full blur-[40px] pointer-events-none -translate-x-1/2 translate-y-1/2"></div>

            <div className="relative z-10 flex flex-col h-full gap-4">
              <div>
                <div className="inline-flex items-center gap-2 mb-3 bg-white/10 px-3 py-1 rounded-full backdrop-blur-md border border-white/20 shadow-sm">
                  <AudioWaveform className="h-4 w-4 text-purple-200" />
                  <span className="text-xs font-bold uppercase tracking-widest text-white">
                    AI Voice Studio
                  </span>
                </div>
                <h2 className="text-3xl font-bold mb-2 leading-tight">
                  Thổi hồn <br /> vào trang sách
                </h2>
                <p className="text-white/90 text-sm mb-2 leading-relaxed">
                  Chuyển đổi văn bản thành giọng đọc AI cảm xúc, sống động.
                </p>
              </div>

              <div className="flex-1 flex flex-col justify-start mt-4">
                <div className="bg-white/10 backdrop-blur-xl rounded-xl p-5 border border-white/20 shadow-lg">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-300" />
                    Tính năng
                  </h3>
                  <ul className="space-y-4 mb-5">
                    {[
                      { text: "Giọng đọc đa dạng", icon: Speech },
                      { text: "Cảm xúc tự nhiên", icon: Mic },
                      { text: "Xử lý tức thì", icon: Zap },
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm">
                        <div className="bg-indigo-500/30 p-2 rounded-lg shrink-0">
                          <item.icon className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-medium text-white/95 text-sm">
                          {item.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="text-[10px] text-white/40 text-center mt-auto">
                Powered by IOSRA AI
              </div>
            </div>
          </div>

          {/* --- CỘT PHẢI: GÓI MUA --- */}
          <div className="flex-1 min-w-0 p-8 bg-white dark:bg-card overflow-auto flex flex-col">
            <div className="flex-shrink-0 flex items-center justify-between mb-8 pb-4 border-b border-border/50">
              <div className="pr-12">
                <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  Mua Ký tự (Characters)
                </DialogTitle>
                <DialogDescription className="text-base text-muted-foreground">
                  Nạp ký tự để tạo Audio cho truyện của bạn
                </DialogDescription>
              </div>

              <div className="bg-indigo-50 dark:bg-muted px-4 py-2 rounded-lg border border-indigo-100 dark:border-indigo-900 shadow-sm mr-8">
                <p className="text-xs text-muted-foreground font-medium mb-1">
                  Ký tự còn lại
                </p>
                <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                  <Feather className="h-5 w-5" />
                  {realVoiceBalance.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Grid Gói Nạp - Dynamic Rendering */}
            <div className="flex-1 flex flex-col justify-center items-center py-2">
              {isLoadingPackages ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-2" />
                  <p className="text-muted-foreground text-sm">
                    Đang tải gói cước...
                  </p>
                </div>
              ) : packages.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground bg-gray-50 rounded-lg p-4 w-full">
                  Hiện chưa có gói cước nào khả dụng.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-3xl">
                  {packages.map((pkg, idx) => {
                    // Logic xác định Theme:
                    // Gói đầu tiên (rẻ nhất) dùng Theme Basic
                    // Các gói sau dùng Theme PRO (Violet)
                    const isPro = idx > 0;
                    const theme = isPro ? THEMES.PRO : THEMES.BASIC;
                    const isPopular = isPro; // Gắn nhãn Popular cho gói Pro

                    return (
                      <Card
                        key={pkg.pricingId}
                        onClick={() => {
                          if (processingId === null)
                            handleTopUp(pkg.amountVnd, pkg.pricingId);
                        }}
                        className={`group cursor-pointer relative overflow-visible transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-2 h-[340px] rounded-2xl flex flex-col justify-between
                          ${theme.border} ${theme.bg}
                          ${
                            processingId === pkg.pricingId
                              ? "opacity-80 pointer-events-none ring-2 ring-offset-2 ring-indigo-400"
                              : ""
                          }
                        `}
                      >
                        {isPopular && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10 tracking-wide uppercase whitespace-nowrap animate-pulse">
                            Siêu hời (Best Value)
                          </div>
                        )}

                        <CardContent className="p-6 flex flex-col items-center text-center h-full justify-center gap-5">
                          <div
                            className={`h-24 w-24 rounded-full flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-110 
                              ${theme.iconBg}`}
                          >
                            <theme.icon
                              className={`h-12 w-12 ${theme.iconColor}`}
                            />
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-black text-3xl text-gray-900 dark:text-white">
                              {pkg.charsGranted.toLocaleString()}
                            </h4>
                            <span className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                              Ký tự
                            </span>
                          </div>

                          {/* Placeholder cho Bonus nếu cần (tạm để trống để giữ layout) */}
                          <div className="h-[28px] flex items-center justify-center"></div>

                          <div className="w-full mt-2">
                            <div
                              className={`w-full py-3.5 rounded-xl font-bold text-xl transition-colors shadow-sm flex items-center justify-center
                                ${theme.btn}
                              `}
                            >
                              {processingId === pkg.pricingId ? (
                                <Loader2 className="animate-spin h-6 w-6 text-white" />
                              ) : (
                                `${pkg.amountVnd.toLocaleString()}đ`
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex-shrink-0 border-t border-border/40 pt-6 mt-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-muted/50 rounded-lg justify-center w-fit mx-auto">
                <CreditCard className="h-4 w-4 text-gray-500" />
                <span className="text-xs font-medium text-center text-gray-600 dark:text-gray-300">
                  Hỗ trợ thanh toán VietQR / Banking
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
