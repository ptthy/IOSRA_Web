// components/payment/StatusSection.tsx

// components/payment/StatusSection.tsx
/**
 * MỤC ĐÍCH: Hiển thị trạng thái thanh toán và cung cấp nút điều hướng
 * CHỨC NĂNG CHÍNH:
 * - Hiển thị thông báo thành công/thất bại với icon visual
 * - Hiển thị card cảm ơn (khi success) hoặc card hỗ trợ (khi cancel)
 * - Cung cấp nút "Về trang chủ" với màu sắc phù hợp
 * - Tạo hiệu ứng nền và animation cho trải nghiệm tốt
 * LOGIC XỬ LÝ:
 * - Conditional rendering dựa trên status
 * - Gradient button với hover effect
 * - Hiệu ứng tim bay khi thanh toán thành công
 */

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import {
  CheckCircle,
  XCircle,
  Home,
  RotateCcw,
  Heart,
  Sparkles,
} from "lucide-react";

interface StatusSectionProps {
  status: "success" | "cancel";
  isLoading?: boolean;
  walletBalance?: number;
}

export function StatusSection({ status }: StatusSectionProps) {
  /**
   * Xác định trạng thái để hiển thị UI phù hợp
   * - success: Hiển thị thông báo thành công, cảm ơn
   * - cancel: Hiển thị thông báo hủy, hỗ trợ
   */
  const isSuccess = status === "success";

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white p-8 flex flex-col justify-center h-full relative overflow-hidden">
      {/* Background decoration (Họa tiết mờ phía sau cho đỡ trống) */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-green-100 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-yellow-100 rounded-full blur-3xl opacity-20 pointer-events-none"></div>

      <div className="text-center space-y-6 relative z-10">
        {/* Icon Header - Icon trạng thái lớn */}
        <div className="relative inline-block">
          <div
            className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${
              isSuccess ? "bg-green-50" : "bg-red-50"
            } mb-2 animate-in zoom-in duration-300`}
          >
            {isSuccess ? (
              <CheckCircle className="w-10 h-10 text-green-600 drop-shadow-sm" />
            ) : (
              <XCircle className="w-10 h-10 text-red-600 drop-shadow-sm" />
            )}
          </div>
          {/* Hiệu ứng tim nhỏ bay lên khi thành công */}
          {isSuccess && (
            <div className="absolute -top-1 -right-1 bg-white rounded-full p-1.5 shadow-sm border border-yellow-100">
              <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
            </div>
          )}
        </div>
        {/* Thông báo chính */}
        <div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">
            {isSuccess ? "Thanh toán thành công!" : "Thanh toán đã hủy"}
          </h2>
          <p className="text-sm text-gray-500">
            {isSuccess
              ? "Giao dịch đã được xử lý hoàn tất."
              : "Giao dịch chưa hoàn tất. Vui lòng thử lại nếu cần."}
          </p>
        </div>

        {/* --- PHẦN THANK YOU CARD (LẤP CHỖ TRỐNG) --- */}
        {isSuccess ? (
          /**
           * Card cảm ơn khi thanh toán thành công
           * Sử dụng gradient vàng-xanh lá
           */
          <div className="bg-gradient-to-br from-yellow-50 via-white to-green-50 p-5 rounded-xl border border-yellow-100 shadow-sm relative group hover:shadow-md transition-all duration-300">
            <Sparkles className="absolute top-3 right-3 w-4 h-4 text-yellow-500 opacity-50" />

            <div className="flex flex-col items-center gap-2">
              <h3 className="font-bold text-gray-800 text-sm">
                Cảm ơn bạn đã ủng hộ Tora!
              </h3>
            </div>

            <p className="text-xs text-gray-600 mt-2 leading-relaxed">
              Sự tin tưởng và đóng góp của bạn là động lực to lớn để chúng tôi
              xây dựng cộng đồng truyện chất lượng hơn mỗi ngày.
            </p>
          </div>
        ) : (
          /**
           * Card hỗ trợ khi thanh toán thất bại/hủy
           * Liệt kê các điểm hỗ trợ cho người dùng
           */
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm text-left">
            <h3 className="font-bold text-gray-900 text-sm mb-2">
              Thông tin hỗ trợ
            </h3>
            <ul className="space-y-2 text-xs text-gray-600">
              <li className="flex gap-2">
                ✓ <span>Tài khoản không bị trừ tiền</span>
              </li>
              <li className="flex gap-2">
                ✓ <span>Có thể tạo lệnh nạp mới bất cứ lúc nào</span>
              </li>
            </ul>
          </div>
        )}

        {/* Buttons - Nút điều hướng */}
        <div className="space-y-3 pt-2">
          {isSuccess ? (
            <Link href="/" className="block w-full">
              /** * Nút về trang chủ với gradient xanh lá khi thành công */
              <Button className="w-full h-11 bg-gradient-to-r from-green-400 to-emerald-600 hover:from-green-500 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 font-semibold">
                <Home className="w-4 h-4 mr-2" /> Về trang chủ
              </Button>
            </Link>
          ) : (
            /**
             * Nút về trang chủ với gradient đỏ khi hủy
             */
            <>
              <Link href="/" className="block w-full">
                <Button className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white border-0 shadow-lg transition-all duration-300">
                  <Home className="w-4 h-4 mr-2" /> Về trang chủ
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
