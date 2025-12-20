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

  // Lấy cả 2 mã từ URL
  const paymentId = searchParams.get("id");
  const orderCode = searchParams.get("orderCode");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // THAY ĐỔI QUAN TRỌNG: Ưu tiên dùng orderCode (dãy số) thay vì id (chuỗi hex)
    // vì Backend thường dùng orderCode để quản lý giao dịch nạp tiền.
    const finalId = orderCode || paymentId;

    if (mounted && finalId && !hasCalledApi.current) {
      hasCalledApi.current = true;
      console.log("🚀 Đang gửi lệnh hủy với mã đơn:", finalId);

      paymentService
        .cancelPaymentLink({
          transactionId: finalId, // Gửi dãy số 1766... lên đây
          cancellationReason: "User cancelled from payment gateway",
        })
        .then((res) => {
          console.log("✅ Backend báo OK:", res);
          localStorage.removeItem("pendingTransactionId");
        })
        .catch((err) => {
          console.error("❌ Lỗi API:", err.response?.data || err.message);
          // Nếu vẫn lỗi 400, hãy thử đổi ngược lại dùng paymentId
        });
    }
  }, [mounted, paymentId, orderCode]);

  // Phần render giữ nguyên
  if (!mounted)
    return (
      <div className="h-screen flex items-center justify-center">
        Đang khởi tạo...
      </div>
    );

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
