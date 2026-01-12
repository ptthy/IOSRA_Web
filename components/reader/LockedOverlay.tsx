//components/reader/LockedOverlay.tsx
/*
MỤC ĐÍCH & CHỨC NĂNG:
────────────────────────────────────────────────────────────────────────────
Component LockedOverlay hiển thị khi chương truyện bị khóa (cần mua).
Nó cung cấp giao diện để user mở khóa chương bằng Dias (tiền ảo trong app).

CHỨC NĂNG CHÍNH:
1. Hiển thị thông tin chương khóa và giá mở khóa
2. Kiểm tra số dư Dias của user
3. Hiển thị thông báo khi số dư không đủ
4. Hiển thị confirm dialog trước khi mua
5. Gọi API mua chương và xử lý kết quả
6. Cung cấp nút nạp Dias để chuyển sang TopUpModal

CÁCH HOẠT ĐỘNG:
- Nhận thông tin chapter, giá, số dư từ component cha
- Kiểm tra số dư trước khi hiển thị confirm dialog
- Gọi API chapterPurchaseApi.buyChapter khi user confirm
- Xử lý các trường hợp lỗi: đã mua, số dư không đủ, lỗi server
- Hiển thị toast notifications cho user

LIÊN KẾT VỚI CÁC COMPONENT KHÁC:
- Được sử dụng bởi ChapterReader khi chapter.isLocked = true
- Gọi API từ services/chapterPurchaseService
- Sử dụng Dialog component từ ui/dialog cho confirm dialog
- Gọi setShowTopUpModal để mở modal nạp tiền
- Sử dụng toast từ sonner để hiển thị thông báo
*/

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
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { chapterPurchaseApi } from "@/services/chapterPurchaseService";
import { toast } from "sonner";
import { TopUpModal } from "@/components/payment/TopUpModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Props interface cho LockedOverlay
 * @param {string} chapterId - ID của chapter bị khóa
 * @param {number} priceDias - Giá mở khóa (tính bằng Dias)
 * @param {() => void} onUnlockSuccess - Callback khi mở khóa thành công
 * @param {number} currentBalance - Số dư Dias hiện tại của user
 * @param {(show: boolean) => void} setShowTopUpModal - Callback để hiển thị modal nạp tiền
 * @param {string} storyTitle - Tiêu đề truyện (optional)
 * @param {string} chapterTitle - Tiêu đề chapter (optional)
 * @param {number} chapterNo - Số thứ tự chapter (optional)
 */
interface LockedOverlayProps {
  chapterId: string;
  priceDias: number;
  onUnlockSuccess: () => void;
  currentBalance?: number;
  setShowTopUpModal: (show: boolean) => void;
  storyTitle?: string;
  chapterTitle?: string;
  chapterNo?: number;
}

/**
 * Component LockedOverlay: Hiển thị khi chapter bị khóa (cần mua)
 * - Hiển thị thông tin giá và số dư
 * - Kiểm tra số dư trước khi mua
 * - Hiển thị confirm dialog trước khi mua
 * - Xử lý API mua chapter
 * - Hiển thị thông báo lỗi/success
 */
export const LockedOverlay: React.FC<LockedOverlayProps> = ({
  chapterId,
  priceDias,
  onUnlockSuccess,
  currentBalance = 0,
  setShowTopUpModal,
  storyTitle = "Truyện",
  chapterTitle = "",
  chapterNo = 0,
}) => {
  const [buying, setBuying] = useState(false); // State loading khi đang mua

  const [insufficientBalance, setInsufficientBalance] = useState(false); // State số dư không đủ
  const [showConfirm, setShowConfirm] = useState(false); // State hiển thị confirm dialog

  /**
   * Kiểm tra số dư trước khi mua
   * - So sánh currentBalance với priceDias
   * - Nếu không đủ: hiển thị thông báo lỗi, set insufficientBalance = true
   * - Nếu đủ: mở confirm dialog
   */
  const handlePreCheck = () => {
    if (currentBalance < priceDias) {
      setInsufficientBalance(true);
      toast.error("Số dư không đủ", {
        description: (
          <span className="flex items-center gap-1">
            Bạn cần {priceDias}{" "}
            <Gem className="h-3 w-3 fill-blue-500 text-blue-600" />
            nhưng chỉ có {currentBalance}{" "}
            <Gem className="h-3 w-3 fill-blue-500 text-blue-600" />
          </span>
        ),
      });
      return;
    }
    setInsufficientBalance(false);
    setShowConfirm(true); // Mở Modal xác nhận
  };

  /**
   * Xử lý mua chapter sau khi confirm
   * - Gọi API mua chapter
   * - Xử lý các trường hợp lỗi:
   *   + 409: Đã mua chapter này → mở khóa ngay
   *   + 400: Số dư không đủ
   *   + Các lỗi khác: Hiển thị thông báo
   */
  const handleConfirmBuy = async () => {
    setBuying(true);
    try {
      // Gọi API mua chapter
      const result = await chapterPurchaseApi.buyChapter(chapterId);

      setShowConfirm(false); // Đóng modal confirm

      // Hiển thị thông báo thành công với số dư còn lại
      toast.success("Mở khóa thành công!", {
        description: (
          <span className="flex items-center gap-1">
            Số dư còn lại: {result.walletBalanceAfter.toLocaleString()}
            <Gem className="h-3 w-3 fill-blue-500 text-blue-600" />
          </span>
        ),
      });

      onUnlockSuccess(); // Callback để component cha load nội dung
    } catch (error: any) {
      // Logic xử lý lỗi
      if (error.response && error.response.status === 409) {
        // Lỗi 409: Đã mua chapter này rồi
        toast.success("Bạn đã sở hữu chương này!", {
          description: "Đang tải nội dung...",
        });
        onUnlockSuccess(); // Vẫn mở khóa vì đã mua rồi
        setShowConfirm(false);
      } else if (error.response?.status === 400) {
        // Lỗi 400: Số dư không đủ (dự phòng cho trường hợp race condition)
        setInsufficientBalance(true);
        setShowConfirm(false);
        toast.error("Số dư không đủ");
      } else {
        // Các lỗi khác
        const msg =
          error.response?.data?.error?.message || "Lỗi không xác định.";
        toast.error("Không thể mở khóa", { description: msg });
      }
    } finally {
      setBuying(false); // Tắt trạng thái loading
    }
  };

  return (
    <>
      {/* Overlay chính */}
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

        <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md leading-relaxed mx-auto">
          Nội dung chương này được khóa để ủng hộ tác giả.
          <br />
          Hãy sử dụng{" "}
          <Gem className="h-4 w-4 fill-blue-500 text-blue-600 inline-block align-text-bottom mx-1" />{" "}
          để tiếp tục theo dõi câu chuyện hấp dẫn này nhé!
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
                <div className="text-red-600 dark:text-red-400 mt-1 flex items-center flex-wrap gap-1">
                  <span>Bạn cần</span>
                  <strong className="flex items-center gap-1">
                    {priceDias}{" "}
                    <Gem className="h-4 w-4 fill-blue-500 text-blue-600" />
                  </strong>
                  <span>nhưng chỉ có</span>
                  <strong className="flex items-center gap-1">
                    {currentBalance}{" "}
                    <Gem className="h-4 w-4 fill-blue-500 text-blue-600" />
                  </strong>
                </div>
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
            {currentBalance.toLocaleString()}{" "}
            <Gem className="h-6 w-6 fill-blue-500 text-blue-600" />
          </div>
        </div>

        <div className="w-full max-w-xs space-y-3">
          {/* Nút Mở khóa chính */}
          <Button
            onClick={handlePreCheck} // Kiểm tra trước khi mua
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
                <Unlock className="mr-2 h-5 w-5" /> Mở khóa ngay ({priceDias}
                <Gem className="h-7 w-7 fill-blue-500 text-blue-600 ml-1" />)
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
            Nạp <Gem className="h-4 w-4 fill-blue-500 text-blue-600 ml-1" />
          </Button>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-white/50 dark:bg-black/20 py-2 rounded-lg">
            <AlertCircle className="w-3 h-3" />
            <span>Số dư sẽ được trừ tự động vào ví của bạn</span>
          </div>
        </div>
      </div>
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 border-orange-200">
          <DialogHeader>
            <DialogTitle className="text-center text-xl text-orange-600 flex flex-col items-center gap-2">
              <div className="p-3 bg-orange-100 rounded-full">
                <Lock className="w-6 h-6 text-orange-600" />
              </div>
              Xác nhận mở khóa
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              Bạn có chắc chắn muốn sử dụng{" "}
              <strong className="inline-flex items-center gap-1">
                {priceDias}{" "}
                <Gem className="h-4 w-4 fill-blue-500 text-blue-600" />
              </strong>{" "}
              để mở khóa chương này?
            </DialogDescription>
          </DialogHeader>

          {/* Box thông tin chi tiết */}
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg space-y-3 border border-gray-100 dark:border-gray-800 my-2">
            <div className="flex items-start gap-3">
              <Unlock className="w-4 h-4 text-gray-500 mt-1" />
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">
                  Chương
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                  {storyTitle}
                </p>
              </div>
            </div>
            {/* <div className="flex items-start gap-3">
              <Unlock className="w-4 h-4 text-gray-500 mt-1" />
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">
                  Chương {chapterNo}
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                  {chapterTitle}
                </p>
              </div>
            </div> */}

            <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-200 mt-2">
              <span className="text-sm text-gray-500">Giá mở khóa</span>
              <span className="text-base font-bold text-orange-600 flex items-center gap-1">
                {priceDias}{" "}
                <Gem className="h-4 w-4 fill-blue-500 text-blue-600" />
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Số dư sau khi mua</span>
              <span className="text-sm font-semibold text-blue-600 flex items-center gap-1">
                {(currentBalance - priceDias).toLocaleString()}{" "}
                <Gem className="h-4 w-4 fill-blue-500 text-blue-600" />
              </span>
            </div>
          </div>

          <DialogFooter className="flex flex-row gap-2 justify-end sm:justify-center w-full">
            <Button
              variant="outline"
              onClick={() => setShowConfirm(false)}
              className="flex-1"
              disabled={buying}
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={handleConfirmBuy}
              disabled={buying}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white"
            >
              {buying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Xử lý...
                </>
              ) : (
                "Đồng ý"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
