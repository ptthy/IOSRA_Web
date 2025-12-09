//components/reader/LockedOverlay.tsx

"use client";

import React, { useState } from "react";
import {
  Lock,
  Loader2,
  Unlock,
  AlertCircle,
  Check,
  Gem,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { chapterPurchaseApi } from "@/services/chapterPurchaseService";
import { toast } from "sonner";
import { TopUpModal } from "@/components/payment/TopUpModal";

interface LockedOverlayProps {
  chapterId: string;
  priceDias: number;
  onUnlockSuccess: () => void;
  currentBalance?: number;
  setShowTopUpModal: (show: boolean) => void;
}

export const LockedOverlay: React.FC<LockedOverlayProps> = ({
  chapterId,
  priceDias,
  onUnlockSuccess,
  currentBalance = 0,
  setShowTopUpModal,
}) => {
  const [buying, setBuying] = useState(false);

  const [insufficientBalance, setInsufficientBalance] = useState(false);

  const handleBuy = async () => {
    // Kiểm tra số dư trước khi mua
    if (currentBalance < priceDias) {
      setInsufficientBalance(true);
      return;
    }

    setBuying(true);
    try {
      await chapterPurchaseApi.buyChapter(chapterId);
      toast.success("Mở khóa thành công!", {
        description: "Chúc bạn đọc truyện vui vẻ.",
      });
      onUnlockSuccess();
    } catch (error: any) {
      //  LOGIC MỚI: BẮT LỖI 409 (ChapterPurchased)
      if (error.response && error.response.status === 409) {
        toast.success("Bạn đã sở hữu chương này!", {
          description: "Đang tải nội dung...",
          icon: <Check className="w-4 h-4 text-green-500" />,
        });
        onUnlockSuccess();
      } else if (error.response?.status === 400) {
        // Lỗi số dư không đủ
        setInsufficientBalance(true);
        toast.error("Số dư không đủ", {
          description: `Bạn cần ${priceDias} Dias nhưng chỉ có ${currentBalance} Dias.`,
        });
      } else {
        const msg =
          error.response?.data?.error?.message || "Lỗi không xác định.";
        toast.error("Không thể mở khóa", {
          description: msg,
        });
      }
    } finally {
      setBuying(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 md:p-12 border border-dashed border-orange-300 bg-orange-50/50 dark:bg-orange-950/10 rounded-2xl my-8 animate-in zoom-in-95 duration-500">
        <div className="relative">
          <div className="absolute -inset-4 bg-orange-200 rounded-full opacity-30 blur-lg"></div>
          <div className="relative bg-gradient-to-br from-orange-100 to-white p-6 rounded-full shadow-lg border border-orange-100">
            <Lock className="w-10 h-10 text-orange-500" />
          </div>
        </div>

        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mt-6 mb-2 text-center">
          Chương Trả Phí
        </h3>

        <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md leading-relaxed">
          Nội dung chương này được khóa để ủng hộ tác giả.
          <br />
          Hãy sử dụng Dias để tiếp tục theo dõi câu chuyện hấp dẫn này nhé!
        </p>

        {/* Hiển thị thông báo số dư không đủ */}
        {insufficientBalance && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg max-w-md">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-red-800 dark:text-red-300">
                  Số dư không đủ
                </p>
                <p className="text-red-600 dark:text-red-400 mt-1">
                  Bạn cần <strong>{priceDias} Dias</strong> nhưng chỉ có{" "}
                  <strong>{currentBalance} Dias</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Hiển thị số dư hiện tại */}
        <div className="mb-6 bg-white dark:bg-gray-800 px-4 py-3 rounded-lg border shadow-sm">
          <p className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-1 text-center">
            Số dư hiện tại
          </p>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400 flex items-center justify-center gap-2">
            <Gem className="h-5 w-5 fill-blue-600 dark:fill-blue-400" />
            {currentBalance.toLocaleString()} Dias
          </div>
        </div>

        <div className="w-full max-w-xs space-y-3">
          {/* Nút Mở khóa chính */}
          <Button
            onClick={handleBuy}
            disabled={buying}
            size="lg"
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-orange-200 shadow-xl transition-all hover:scale-[1.02]"
          >
            {buying ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang xử lý...
              </>
            ) : (
              <>
                <Unlock className="mr-2 h-5 w-5" /> Mở khóa ngay ({priceDias}{" "}
                Dias)
              </>
            )}
          </Button>

          {/* Nút Nạp Dias - Hiển thị khi số dư không đủ hoặc luôn hiện */}
          <Button
            onClick={() => setShowTopUpModal(true)}
            variant="outline"
            size="lg"
            className="w-full h-12 border-2 border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700 font-semibold transition-all"
          >
            <Zap className="mr-2 h-5 w-5" />
            Nạp Dias
          </Button>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-white/50 dark:bg-black/20 py-2 rounded-lg">
            <AlertCircle className="w-3 h-3" />
            <span>Số dư sẽ được trừ tự động vào ví của bạn</span>
          </div>
        </div>
      </div>

      {/* Modal nạp Dias */}
    </>
  );
};
