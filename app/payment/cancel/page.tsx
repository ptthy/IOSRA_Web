// app/payment/cancel/page.tsx
"use client";

import React, { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { ReceiptSection } from "@/components/payment/ReceiptSection";
import { StatusSection } from "@/components/payment/StatusSection";
import { paymentService } from "@/services/paymentService";
import { toast } from "sonner";
/**
 * Trang hiển thị khi người dùng hủy thanh toán
 *
 * MỤC ĐÍCH:
 * - Hiển thị thông báo hủy thanh toán
 * - Gọi API hủy payment link để cập nhật trạng thái ở backend
 * - Xóa transaction ID pending khỏi localStorage
 *
 * QUY TRÌNH:
 * 1. Người dùng hủy thanh toán trên cổng thanh toán (PayOS/VNPay)
 * 2. Cổng thanh toán redirect về trang này với các query params
 * 3. Trang này gọi API cancelPaymentLink để thông báo cho backend
 * 4. Hiển thị UI thông báo hủy thanh toán
 *
 * QUERY PARAMS NHẬN ĐƯỢC:
 * - id: paymentId (chuỗi hex) từ PayOS
 * - orderCode: Mã đơn hàng (dãy số) từ PayOS
 *
 * LIÊN THÔNG VỚI:
 * - @/services/paymentService: API cancelPaymentLink
 * - @/components/payment/ReceiptSection: Hiển thị thông tin hóa đơn
 * - @/components/payment/StatusSection: Hiển thị trạng thái và nút hành động
 */
function PaymentCancelContent() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const hasCalledApi = useRef(false); // Ref để đảm bảo chỉ gọi API 1 lần

  // Lấy cả 2 mã từ URL
  const paymentId = searchParams.get("id"); // Chuỗi hex từ PayOS
  const orderCode = searchParams.get("orderCode"); // Dãy số từ PayOS
  /**
   * useEffect đánh dấu component đã mount
   *
   * VÌ SAO CẦN mounted state?
   * - useSearchParams chỉ hoạt động trên client side
   * - Tránh lỗi hydration mismatch giữa server và client
   */
  useEffect(() => {
    setMounted(true);
  }, []);
  /**
   * useEffect gọi API hủy thanh toán
   *
   * LOGIC ƯU TIÊN:
   * 1. Ưu tiên dùng orderCode (dãy số) thay vì id (chuỗi hex)
   * 2. Lý do: Backend thường dùng orderCode để quản lý giao dịch
   * 3. Chỉ gọi API 1 lần với useRef bảo vệ
   *
   * QUAN TRỌNG:
   * - Có thể backend thiết kế nhận paymentId thay vì orderCode
   * - Cần điều chỉnh theo API thực tế của backend
   */
  useEffect(() => {
    // Ưu tiên orderCode, fallback về paymentId
    const finalId = orderCode || paymentId;
    // Điều kiện gọi API:
    // 1. Component đã mount (đảm bảo chạy trên client)
    // 2. Có ID thanh toán
    // 3. Chưa gọi API lần nào (tránh gọi nhiều lần)
    if (mounted && finalId && !hasCalledApi.current) {
      hasCalledApi.current = true; // Đánh dấu đã gọi
      console.log("🚀 Đang gửi lệnh hủy với mã đơn:", finalId);
      // Gọi API hủy payment link
      paymentService
        .cancelPaymentLink({
          transactionId: finalId, // Gửi dãy số 1766... lên đây
          cancellationReason: "User cancelled from payment gateway",
        })
        .then((res) => {
          console.log("✅ Backend báo OK:", res);
          // Xóa transaction ID pending khỏi localStorage
          localStorage.removeItem("pendingTransactionId");
        })
        .catch((err) => {
          console.error("❌ Lỗi API:", err.response?.data || err.message);
          // Có thể thử fallback: dùng paymentId nếu orderCode không work
          // Nhưng trong code này chỉ gọi 1 lần để tránh loop
        });
    }
  }, [mounted, paymentId, orderCode]);

  // Hiển thị loading khi chưa mount (chưa chạy trên client)
  if (!mounted)
    return (
      <div className="h-screen flex items-center justify-center">
        Đang khởi tạo...
      </div>
    );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 via-white to-rose-50">
      <div className="w-full max-w-4xl grid md:grid-cols-2 bg-white shadow-2xl rounded-2xl overflow-hidden min-h-[500px]">
        {/* Bên trái: Thông tin hóa đơn */}
        <ReceiptSection
          status="cancel"
          orderCode={orderCode || paymentId} // Truyền mã đơn để hiển thị
          amount={null} // Hủy nên không có amount
        />
        {/* Bên phải: Trạng thái và nút hành động */}
        <StatusSection status="cancel" />
      </div>
    </div>
  );
}
// Component chính với Suspense
export default function PaymentCancelPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <PaymentCancelContent />
    </Suspense>
  );
}
