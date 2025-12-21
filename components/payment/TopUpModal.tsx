// components/payment/TopUpModal.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Crown,
  Gem,
  Loader2,
  Star,
  Zap,
  CreditCard,
  X,
  Sparkles,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import {
  paymentService,
  PaymentPricingPackage,
} from "@/services/paymentService";
import {
  subscriptionService,
  SubscriptionPlan,
} from "@/services/subscriptionService";
interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance?: number;
}

// Định nghĩa trước các Theme để map theo index của gói
const THEME_MAPPING = [
  {
    // Index 0: Gói Basic (Cyan)
    border: "border-cyan-400 dark:border-cyan-600",
    bg: "bg-cyan-50 dark:bg-cyan-950/30",
    iconBg: "bg-cyan-100 dark:bg-cyan-900/50",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    btn: "bg-cyan-600 hover:bg-cyan-700 text-white",
    badge: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
    icon: Gem,
    label: "Cơ bản",
  },
  {
    // Index 1: Gói Popular (Blue)
    border: "border-blue-500 dark:border-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    iconBg: "bg-blue-100 dark:bg-blue-900/50",
    iconColor: "text-blue-600 dark:text-blue-400",
    btn: "bg-blue-600 hover:bg-blue-700 text-white",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    icon: Gem,
    label: "Phổ biến",
  },
  {
    // Index 2: Gói VIP (Amber/Gold)
    border: "border-amber-400 dark:border-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    iconBg: "bg-amber-100 dark:bg-amber-900/50",
    iconColor: "text-amber-600 dark:text-amber-400",
    btn: "bg-amber-600 hover:bg-amber-700 text-white",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    icon: Gem,
    label: "Đại gia",
  },
];

export function TopUpModal({
  isOpen,
  onClose,
  currentBalance = 0,
}: TopUpModalProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [premiumPlan, setPremiumPlan] = useState<SubscriptionPlan | null>(null);
  // State lưu danh sách gói lấy từ API
  const [packages, setPackages] = useState<PaymentPricingPackage[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);

  // --- Gọi API lấy gói cước khi mở Modal ---
  useEffect(() => {
    if (isOpen) {
      const fetchPricing = async () => {
        const subRes = await subscriptionService.getPlans();
        if (subRes.data && subRes.data.length > 0) {
          // Lấy gói đầu tiên hoặc tìm theo code "premium_month"
          setPremiumPlan(
            subRes.data.find((p) => p.planCode === "premium_month") ||
              subRes.data[0]
          );
        }
        setIsLoadingPackages(true);
        try {
          const res = await paymentService.getPricingPackages();
          if (res.data && Array.isArray(res.data)) {
            // Sắp xếp theo giá tăng dần
            const sortedPackages = res.data.sort(
              (a, b) => a.amountVnd - b.amountVnd
            );
            setPackages(sortedPackages);
          }
        } catch (error) {
          console.error("Lỗi lấy bảng giá:", error);
          toast.error("Không thể tải bảng giá kim cương.");
        } finally {
          setIsLoadingPackages(false);
        }
      };
      fetchPricing();
    }
  }, [isOpen]);

  const handleTopUp = async (amount: number, pkgId: string) => {
    setProcessingId(pkgId);
    try {
      const returnUrl = `${window.location.origin}/payment/success`;
      const cancelUrl = `${window.location.origin}/payment/cancel`;

      // Truyền thêm pricingId vào API
      const response = await paymentService.createPaymentLink({
        amount: amount,
        returnUrl,
        cancelUrl,
        pricingId: pkgId,
      });

      if (response.data?.checkoutUrl) {
        if (response.data.transactionId) {
          localStorage.setItem(
            "pendingTransactionId",
            response.data.transactionId.toString()
          );
        }
        window.location.href = response.data.checkoutUrl;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi tạo giao dịch");
      setProcessingId(null);
    }
  };

  const handleSubscribe = async () => {
    setProcessingId("subscribe");
    try {
      const returnUrl = `${window.location.origin}/payment/success`;
      const cancelUrl = `${window.location.origin}/payment/cancel`;

      const response = await paymentService.createSubscriptionLink({
        planCode: "premium_month",
        returnUrl,
        cancelUrl,
      });

      if (response.data?.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi tạo gói đăng ký");
      setProcessingId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!w-[95vw] !max-w-none h-[90vh] p-0 overflow-hidden bg-card rounded-xl border shadow-2xl flex flex-col [&>button]:hidden fixed left-[50%] -translate-x-1/2 top-[2%] sm:top-[5%] translate-y-0 duration-200">
        <button
          onClick={onClose}
          className="!flex items-center justify-center absolute top-4 right-4 z-50 p-2 rounded-full transition-all duration-200 bg-white hover:bg-red-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-500 hover:text-red-500 dark:text-white shadow-lg shadow-black/10 border-2 border-gray-100 dark:border-zinc-700 hover:scale-110 active:scale-95 cursor-pointer group h-10 w-10"
        >
          <X className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300 stroke-[3px]" />
        </button>

        <div className="flex h-full w-full">
          {/* --- CỘT TRÁI: PREMIUM (Giữ nguyên) --- */}
          <div className="w-[350px] flex-shrink-0 bg-gradient-to-br from-[#FF9966] via-[#FF5E62] to-[#FF0000] p-6 text-white flex flex-col overflow-y-auto scrollbar-hide">
            {/* ... Nội dung Premium giữ nguyên ... */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-[50px] pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-300/20 rounded-full blur-[40px] pointer-events-none -translate-x-1/2 translate-y-1/2"></div>

            <div className="relative z-10 flex flex-col h-full gap-4">
              <div>
                <div className="inline-flex items-center gap-2 mb-3 bg-white/10 px-3 py-1 rounded-full backdrop-blur-md border border-white/20 shadow-sm">
                  <Crown className="h-4 w-4 text-yellow-300 fill-yellow-300" />
                  <span className="text-xs font-bold uppercase tracking-widest text-white">
                    Premium Access
                  </span>
                </div>

                <h2 className="text-3xl font-bold mb-2 leading-tight">
                  Nâng tầm <br /> Trải nghiệm
                </h2>
                <p className="text-white/90 text-sm mb-2 leading-relaxed">
                  Truy cập không giới hạn kho truyện VIP.
                </p>
              </div>

              <div className="flex-1 flex flex-col justify-start mt-2">
                <div className="bg-white/10 backdrop-blur-xl rounded-xl p-5 border border-white/20 shadow-lg">
                  <div className="flex justify-between items-start mb-3 border-b border-white/10 pb-3">
                    <div>
                      <p className="text-xs text-yellow-100 font-semibold uppercase tracking-wider">
                        Gói Tháng
                      </p>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-3xl font-bold text-white">
                          {premiumPlan
                            ? premiumPlan.priceVnd.toLocaleString()
                            : "..."}
                          đ
                        </span>
                        <span className="text-sm font-medium text-white/80">
                          /tháng
                        </span>
                      </div>
                    </div>
                    <Badge className="bg-white text-red-500 hover:bg-white font-bold px-2 py-0.5 shadow-sm text-xs">
                      HOT
                    </Badge>
                  </div>

                  <ul className="space-y-2 mb-5">
                    {[
                      <span
                        key="dias-daily"
                        className="flex items-center gap-1"
                      >
                        50{" "}
                        <Gem className="h-4 w-4 fill-blue-500 text-blue-600 inline" />{" "}
                        mỗi ngày
                      </span>,
                      "Không quảng cáo",
                      "Truyện VIP miễn phí",
                      "Giọng đọc AI Premium",
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <div className="bg-green-400/20 p-1 rounded-full shrink-0">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                        <span className="font-medium text-white/95 text-sm">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={handleSubscribe}
                    disabled={processingId !== null}
                    className="w-full bg-white text-red-600 hover:bg-red-50 hover:text-red-700 font-bold h-11 text-base shadow-lg border-none transition-all active:scale-95 flex items-center justify-center gap-2 rounded-lg"
                  >
                    {processingId === "subscribe" ? (
                      <Loader2 className="animate-spin h-5 w-5" />
                    ) : (
                      <>
                        <Zap className="h-5 w-5 fill-red-600" /> Đăng Ký Premium
                      </>
                    )}
                  </Button>
                  <p className="text-[10px] text-center mt-2 text-white/60">
                    Gia hạn tự động. Hủy bất cứ lúc nào.
                  </p>
                </div>
              </div>
              <div className="text-[10px] text-white/40 text-center mt-auto">
                Áp dụng Điều khoản dịch vụ & CSBM.
              </div>
            </div>
          </div>

          {/* --- CỘT PHẢI: GÓI NẠP LẺ (DYNAMIC) --- */}
          <div className="flex-1 min-w-0 p-8 bg-white dark:bg-card overflow-auto flex flex-col">
            <div className="flex-shrink-0 flex items-center justify-between mb-4 pb-4 border-b border-border/50">
              <div className="pr-12">
                <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  Cửa hàng Kim Cương
                </DialogTitle>
                <DialogDescription className="text-base text-muted-foreground">
                  Nạp kim cương để mở khóa các chương truyện
                </DialogDescription>
              </div>

              <div className="bg-gray-50 dark:bg-muted px-4 py-2 rounded-lg border shadow-sm mr-8">
                <p className="text-xs text-muted-foreground font-medium mb-1">
                  Số dư hiện tại
                </p>
                <div className="text-xl font-bold text-blue-600 flex items-center gap-2">
                  <Gem className="h-5 w-5 fill-blue-600" />
                  {currentBalance.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Grid Các Gói Nạp - Động */}
            <div className="flex-1 flex flex-col justify-center py-2">
              {isLoadingPackages ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-2" />
                  <p className="text-muted-foreground text-sm">
                    Đang tải gói nạp...
                  </p>
                </div>
              ) : packages.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground bg-gray-50 rounded-lg">
                  Hiện chưa có gói nạp nào.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {packages.map((pkg, idx) => {
                    // Logic chọn Theme dựa trên index, xoay vòng nếu vượt quá 3 gói
                    // Index 0: Cơ bản, 1: Phổ biến, 2: Đại gia
                    const themeIndex = idx % THEME_MAPPING.length;
                    const theme = THEME_MAPPING[themeIndex];

                    // Logic Popular: Gói thứ 2 (giữa) thường là phổ biến
                    const isPopular = idx === 1;

                    // Tính Bonus (Optional): So sánh tỷ lệ Kim cương/Giá tiền với gói thấp nhất
                    // Tỷ lệ cơ bản (Gói 0)
                    const baseRate =
                      packages[0].amountVnd > 0
                        ? packages[0].diamondGranted / packages[0].amountVnd
                        : 0;
                    const currentRate =
                      pkg.amountVnd > 0
                        ? pkg.diamondGranted / pkg.amountVnd
                        : 0;

                    let bonusPercent = 0;
                    if (baseRate > 0 && currentRate > baseRate) {
                      bonusPercent = Math.round(
                        ((currentRate - baseRate) / baseRate) * 100
                      );
                    }

                    return (
                      <Card
                        key={pkg.pricingId}
                        onClick={() => {
                          if (processingId === null)
                            handleTopUp(pkg.amountVnd, pkg.pricingId);
                        }}
                        className={`group cursor-pointer relative overflow-visible transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-2 h-[300px] rounded-2xl flex flex-col justify-between
                          ${theme.border} ${theme.bg}
                          ${
                            processingId === pkg.pricingId
                              ? "opacity-80 pointer-events-none ring-2 ring-offset-2 ring-blue-400"
                              : ""
                          }
                        `}
                      >
                        {isPopular && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10 tracking-wide uppercase whitespace-nowrap">
                            Phổ biến nhất
                          </div>
                        )}

                        <CardContent className="p-5 flex flex-col items-center text-center h-full justify-center gap-4">
                          <div
                            className={`h-20 w-20 rounded-2xl flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-110 
                              ${theme.iconBg}`}
                          >
                            <Gem className="h-10 w-10 text-blue-500 fill-blue-500 opacity-80" />
                          </div>

                          <div className="space-y-1">
                            <h4 className="font-black text-3xl text-gray-900 dark:text-white">
                              {pkg.diamondGranted.toLocaleString()}
                            </h4>
                            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                              Kim Cương
                            </span>
                          </div>

                          {/* Hiển thị Bonus nếu tính được > 0 */}
                          {bonusPercent > 0 ? (
                            <Badge
                              variant="secondary"
                              className={`font-bold px-3 py-1 text-xs border-0 ${theme.badge}`}
                            >
                              <Sparkles className="w-3 h-3 mr-1 inline-block" />
                              +{bonusPercent}% Bonus
                            </Badge>
                          ) : (
                            <div className="h-[26px]"></div>
                          )}

                          <div className="w-full mt-2">
                            <div
                              className={`w-full py-3 rounded-xl font-bold text-lg transition-colors shadow-sm flex items-center justify-center
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

            <div className="flex-shrink-0 border-t border-border/40 pt-4 mt-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-muted/50 rounded-lg justify-center">
                <CreditCard className="h-4 w-4 text-gray-500" />
                <span className="text-xs font-medium text-center text-gray-600 dark:text-gray-300">
                  Thanh toán an toàn qua VietQR / Chuyển khoản ngân hàng
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
