// app/payment/cancel/page.tsx
"use client";

import React, { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { ReceiptSection } from "@/components/payment/ReceiptSection";
import { StatusSection } from "@/components/payment/StatusSection";
import { paymentService } from "@/services/paymentService";
import { toast } from "sonner";

function PaymentCancelContent() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const hasCalledApi = useRef(false);

  // Lấy ID từ URL (PayOS thường dùng tham số 'id')
  const paymentId = searchParams.get("id");
  const orderCode = searchParams.get("orderCode");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Chỉ chạy khi đã mount thành công ở Client để tránh lỗi #418
    if (mounted && (paymentId || orderCode) && !hasCalledApi.current) {
      const finalId = paymentId || orderCode;
      hasCalledApi.current = true;

      console.log("🚀 Đang thực hiện báo hủy đơn hàng:", finalId);

      // Kiểm tra Token trước khi gọi
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.warn(
          "⚠️ Không tìm thấy Token. Vui lòng đăng nhập trên trang này để báo hủy thành công."
        );
        return;
      }

      paymentService
        .cancelPaymentLink({
          transactionId: finalId as string,
          cancellationReason: "User cancelled on payment page",
        })
        .then((res) => {
          console.log("✅ Backend đã chuyển trạng thái sang CANCELLED:", res);
          toast.success("Đã hủy đơn hàng thành công");
          localStorage.removeItem("pendingTransactionId");
        })
        .catch((err) => {
          console.error(
            "❌ Lỗi API cancel-link:",
            err.response?.data || err.message
          );
          // Cho phép thử lại nếu lỗi mạng
          hasCalledApi.current = false;
        });
    }
  }, [mounted, paymentId, orderCode]);

  // Render loading để tránh Hydration Mismatch #418
  if (!mounted) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Đang xác nhận hủy giao dịch...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 via-white to-rose-50">
      <div className="w-full max-w-4xl grid md:grid-cols-2 bg-white shadow-2xl rounded-2xl overflow-hidden min-h-[500px]">
        <ReceiptSection
          status="cancel"
          orderCode={orderCode || paymentId}
          amount={null}
        />
        <StatusSection status="cancel" />
      </div>
    </div>
  );
}

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
