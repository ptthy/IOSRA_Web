//app/payment/success/page.tsx
"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ReceiptSection } from "@/components/payment/ReceiptSection";
import { StatusSection } from "@/components/payment/StatusSection";
import { profileService } from "@/services/profileService"; // Import service của bạn

function PaymentSuccessContent() {
  const searchParams = useSearchParams();

  // Lấy params trả về từ PayOS
  const orderCode = searchParams.get("orderCode");
  const amount = searchParams.get("amount");
  const status = searchParams.get("status"); // Thông thường là "PAID"

  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<number | undefined>(undefined);

  useEffect(() => {
    // Xóa transaction ID pending
    localStorage.removeItem("pendingTransactionId");

    // Fetch số dư mới nhất
    const fetchWallet = async () => {
      try {
        // Đợi 1 chút để DB đồng bộ webhook (nếu cần)
        await new Promise((r) => setTimeout(r, 1000));

        // Gọi API lấy thông tin ví thực tế
        const res = await profileService.getProfile();
        // Giả sử res.data.wallet.balance chứa số dư
        // Cần điều chỉnh theo response thực tế của bạn
        setBalance(res.data?.wallet?.balance || 0);
      } catch (error) {
        console.error("Failed to fetch wallet", error);
      } finally {
        setLoading(false);
      }
    };

    if (status === "PAID") {
      fetchWallet();
    } else {
      setLoading(false);
    }
  }, [status]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="w-full max-w-4xl grid md:grid-cols-2 bg-white shadow-2xl rounded-2xl overflow-hidden min-h-[500px]">
        {/* Left: Receipt */}
        <ReceiptSection
          status="success"
          orderCode={orderCode}
          amount={amount}
        />

        {/* Right: Actions */}
        <StatusSection
          status="success"
          isLoading={loading}
          walletBalance={balance}
        />
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
