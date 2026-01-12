//app/payment/success/page.tsx
"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ReceiptSection } from "@/components/payment/ReceiptSection";
import { StatusSection } from "@/components/payment/StatusSection";
import { profileService } from "@/services/profileService"; // Import service của bạn
/**
 * Trang hiển thị khi thanh toán thành công
 *
 * MỤC ĐÍCH:
 * - Hiển thị thông báo thanh toán thành công
 * - Fetch số dư mới nhất từ backend (sau khi webhook cập nhật)
 * - Xóa transaction ID pending khỏi localStorage
 * - Cung cấp nút hành động tiếp theo (về trang chủ, xem lịch sử)
 *
 * QUY TRÌNH:
 * 1. Người dùng thanh toán thành công trên cổng thanh toán
 * 2. Cổng thanh toán redirect về trang này với query params
 * 3. PayOS gọi webhook để cập nhật trạng thái trong DB
 * 4. Trang này fetch số dư mới nhất từ backend
 * 5. Hiển thị UI thông báo thành công
 *
 * QUERY PARAMS NHẬN ĐƯỢC:
 * - orderCode: Mã đơn hàng
 * - amount: Số tiền đã thanh toán
 * - status: Trạng thái (thường là "PAID")
 *
 * LIÊN THÔNG VỚI:
 * - @/services/profileService: Lấy thông tin ví/số dư
 * - PayOS webhook: Cập nhật trạng thái thanh toán
 * - @/components/payment/ReceiptSection: Hiển thị hóa đơn
 * - @/components/payment/StatusSection: Hiển thị trạng thái và nút hành động
 */
function PaymentSuccessContent() {
  const searchParams = useSearchParams();

  // Lấy params trả về từ PayOS sau khi thanh toán thành công
  const orderCode = searchParams.get("orderCode");
  const amount = searchParams.get("amount");
  const status = searchParams.get("status"); // Thông thường là "PAID"
  // State quản lý UI và dữ liệu
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<number | undefined>(undefined);
  /**
   * useEffect xử lý sau khi thanh toán thành công
   *
   * QUY TRÌNH CHI TIẾT:
   * 1. Xóa pending transaction ID khỏi localStorage
   * 2. Nếu status là PAID -> fetch số dư mới
   * 3. Đợi 1 giây để đảm bảo webhook đã cập nhật DB
   * 4. Gọi API lấy profile để lấy số dư mới nhất
   * 5. Cập nhật UI với số dư mới
   */
  useEffect(() => {
    // 1. Xóa transaction ID pending
    // Tránh trường hợp người dùng quay lại trang thanh toán cũ
    localStorage.removeItem("pendingTransactionId");

    // 2. Fetch số dư mới nhất
    const fetchWallet = async () => {
      try {
        // 3. Đợi 1 giây để đảm bảo webhook PayOS đã xử lý xong
        // PayOS sẽ gọi webhook để cập nhật trạng thái và số dư
        // Nếu fetch ngay có thể lấy số dư cũ
        await new Promise((r) => setTimeout(r, 1000));

        // 4. Gọi API lấy thông tin profile/ví
        const res = await profileService.getProfile();
        // 5. Cập nhật số dư (điều chỉnh theo response thực tế)
        // Giả sử res.data.wallet.balance chứa số dư
        setBalance(res.data?.wallet?.balance || 0);
      } catch (error) {
        console.error("Failed to fetch wallet", error);
      } finally {
        setLoading(false);
      }
    };
    // Chỉ fetch khi thanh toán thành công (status = "PAID")
    if (status === "PAID") {
      fetchWallet();
    } else {
      // Nếu status khác "PAID" (ít xảy ra) thì chỉ tắt loading
      setLoading(false);
    }
  }, [status]); // Chỉ chạy lại khi status thay đổi

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="w-full max-w-4xl grid md:grid-cols-2 bg-white shadow-2xl rounded-2xl overflow-hidden min-h-[500px]">
        {/* Left: Receipt - Hiển thị thông tin hóa đơn */}
        <ReceiptSection
          status="success"
          orderCode={orderCode}
          amount={amount}
        />

        {/* Right: Actions - Hiển thị trạng thái và nút hành động */}
        <StatusSection
          status="success"
          isLoading={loading}
          walletBalance={balance} // Truyền số dư mới để hiển thị
        />
      </div>
    </div>
  );
}
// Component chính với Suspense
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
