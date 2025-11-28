//app/payment/cancel/page.tsx

"use client";

import React, { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ReceiptSection } from "@/components/payment/ReceiptSection";
import { StatusSection } from "@/components/payment/StatusSection";

function PaymentCancelContent() {
  const searchParams = useSearchParams();

  const orderCode = searchParams.get("orderCode");
  const status = searchParams.get("status"); // Thường là "CANCELLED"
  const cancelReason = searchParams.get("cancel"); // Biến check xem có phải cancel không

  useEffect(() => {
    localStorage.removeItem("pendingTransactionId");
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 via-white to-rose-50">
      <div className="w-full max-w-4xl grid md:grid-cols-2 bg-white shadow-2xl rounded-2xl overflow-hidden min-h-[500px]">
        {/* Left: Receipt */}
        <ReceiptSection
          status="cancel"
          orderCode={orderCode}
          // Cancel thường không trả về amount trên URL nếu không config,
          // có thể để null hoặc lấy từ localStorage nếu bạn có lưu trước đó
          amount={null}
        />

        {/* Right: Actions */}
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
