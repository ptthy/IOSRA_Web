//app/verify-otp/page.tsx

"use client";

// ---  1: IMPORT TẤT CẢ DEPENDENCIES ---
import React, { useState, useEffect, Suspense } from "react";
// Imports từ shadcn/ui (sửa sang đường dẫn tương đối)
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
// Imports từ lucide
import { Mail, ShieldCheck, Clock, RefreshCw } from "lucide-react";
// Imports từ thư viện khác
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

import { authService } from "@/services/authService";

// ---  2: TẠO COMPONENT ROUTE CHÍNH ---
/**
 * COMPONENT CHÍNH: VERIFY OTP ROUTE
 *
 * MỤC ĐÍCH: Bao bọc OTPForm với Suspense để xử lý loading khi useSearchParams chưa sẵn sàng
 *
 * VÌ SAO CẦN SUSPENSE:
 * - useSearchParams() là client component hook
 * - Trong Next.js 13+, nếu dùng useSearchParams mà không bọc Suspense sẽ gây lỗi
 * - Suspense hiển thị fallback UI trong khi đang load search params
 */
export default function VerifyOTPRoute() {
  return (
    <Suspense
      fallback={
        // Giao diện tải đơn giản
        <div className="min-h-screen flex items-center justify-center bg-background">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <OTPForm />
    </Suspense>
  );
}

// ---3: ĐỊNH NGHĨA OTPFORM ---
// ---3: ĐỊNH NGHĨA OTPFORM ---
/**
 * COMPONENT CHÍNH: OTP FORM
 *
 * MỤC ĐÍCH: Hiển thị form nhập mã OTP để xác thực email
 * CHỨC NĂNG:
 * 1. Hiển thị mã OTP input (6 số)
 * 2. Đếm ngược thời gian hiệu lực OTP (5 phút)
 * 3. Cho phép gửi lại OTP khi hết thời gian
 * 4. Xác thực OTP với backend
 * 5. Redirect về trang login sau khi xác thực thành công
 *
 * FLOW DỮ LIỆU:
 * 1. Lấy email từ URL query params (?email=abc@gmail.com)
 * 2. Người dùng nhập 6 số OTP
 * 3. Tự động submit khi đủ 6 số
 * 4. Gọi API verifyOtp
 * 5. Nếu thành công -> redirect /login
 * 6. Nếu thất bại -> hiển thị lỗi, reset OTP input
 */
function OTPForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email"); // Lấy email từ địa chỉ trình duyệt (VD: /verify-otp?email=abc@gmail.com)
  // Các State quản lý trạng thái của trang
  const [otp, setOtp] = useState(""); // Lưu giá trị mã OTP người dùng nhập
  const [isLoading, setIsLoading] = useState(false); // Trạng thái đang gọi API
  const [countdown, setCountdown] = useState(300); // 5 phút
  const [canResend, setCanResend] = useState(false); // Cho phép gửi lại OTP hay không
  const [imageError, setImageError] = useState(false); // Lỗi khi tải ảnh background

  /**
   * EFFECT ĐẾM NGƯỢC THỜI GIAN OTP
   *
   * LOGIC:
   * 1. Nếu countdown > 0: giảm 1 giây mỗi giây
   * 2. Khi countdown = 0: set canResend = true (cho phép gửi lại)
   * 3. Cleanup timer khi component unmount hoặc countdown thay đổi
   */
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer); // Dọn dẹp timer khi component unmount hoặc countdown thay đổi
    } else {
      setCanResend(true); // Khi countdown về 0, cho phép gửi lại OTP
    }
  }, [countdown]);

  /**
   * HÀM XÁC THỰC OTP
   *
   * FLOW CHI TIẾT:
   * 1. Validate OTP (6 số)
   * 2. Kiểm tra email có tồn tại không
   * 3. Gọi API verifyOtp
   * 4. Nếu thành công: toast success, redirect /login
   * 5. Nếu lỗi: xử lý lỗi chi tiết từ backend
   *
   * XỬ LÝ LỖI THEO THỨ TỰ ƯU TIÊN:
   * 1. Validation errors (details)
   * 2. Message từ backend
   * 3. Fallback message
   */
  const handleVerify = async (otpValue: string) => {
    if (otpValue.length !== 6) {
      toast.error("Vui lòng nhập đủ 6 số!");
      return;
    }
    // Kiểm tra email có tồn tại không
    if (!email) {
      toast.error("Không tìm thấy địa chỉ email. Vui lòng quay lại.");
      router.push("/register"); // Redirect về trang đăng ký
      return;
    }
    setIsLoading(true); // Bắt đầu loading

    try {
      // Gọi API xác thực OTP
      await authService.verifyOtp({ email, otp: otpValue });
      toast.success("Xác thực thành công! Vui lòng đăng nhập.");
      router.push("/login"); // Redirect về trang đăng nhập sau khi thành công
    } catch (err: any) {
      // Xử lý lỗi chi tiết từ API response
      toast.error(
        err.response?.data?.message || "Mã OTP không đúng hoặc hết hạn."
      );
      setIsLoading(false); // Kết thúc loading
      setOtp(""); // Xóa OTP khi lỗi
      // --- XỬ LÝ LỖI CHI TIẾT ---
      if (err.response && err.response.data && err.response.data.error) {
        const { code, message, details } = err.response.data.error;

        // 1. Ưu tiên Validation (Ví dụ: format OTP sai)
        if (details) {
          const firstKey = Object.keys(details)[0];
          if (firstKey && details[firstKey].length > 0) {
            toast.error(details[firstKey].join(" "));
            return;
          }
        }

        // 2. Xử lý message từ Backend (Ví dụ: "Mã OTP đã hết hạn", "Mã không đúng")
        if (message) {
          toast.error(message);
          return;
        }
      }

      // 3. Fallback: Lỗi chung
      const fallbackMsg =
        err.response?.data?.message || "Mã OTP không đúng hoặc hết hạn.";
      toast.error(fallbackMsg);
    }
  };

  /**
   * HÀM WRAPPER CHO FORM SUBMIT
   * Ngăn chặn default form submit behavior
   */ const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify(otp);
  };

  /**
   * HÀM GỬI LẠI OTP
   *
   * LOGIC:
   * 1. Chỉ gửi khi canResend = true và có email
   * 2. Gọi API forgotPassword (hoặc resendOtp) để gửi lại mã
   * 3. Reset countdown về 5 phút
   * 4. Lock nút resend trong thời gian đếm ngược
   */
  const handleResend = async () => {
    // Chỉ gửi lại khi được phép và có email
    if (!canResend || !email) return;

    setIsLoading(true); // Hiển thị loading trên nút
    try {
      // API gửi lại mã
      await authService.forgotPassword({ email });

      // Reset timer và state
      setCountdown(300); // Reset về 5 phút
      setCanResend(false); // Tạm khóa nút gửi lại
      setOtp(""); //Xóa mã OTP cũ
      toast.success("Mã OTP mới đã được gửi!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gửi lại mã thất bại.");
    } finally {
      setIsLoading(false); // Dừng loading
    }
  };

  /**
   * FORMAT COUNTDOWN THÀNH MM:SS
   *
   * VÍ DỤ: 300 giây -> "5:00", 65 giây -> "1:05"
   */
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  /**
   * HÀM XỬ LÝ KHI OTP INPUT THAY ĐỔI
   *
   * LOGIC TỰ ĐỘNG SUBMIT:
   * 1. Cập nhật state otp
   * 2. Nếu đủ 6 số -> tự động gọi handleVerify
   *
   * UX TỐT: Người dùng không cần nhấn nút, trải nghiệm mượt mà
   */
  const handleOTPChange = (value: string) => {
    setOtp(value);

    // Tự động submit khi đủ 6 số
    if (value.length === 6) {
      handleVerify(value);
    }
  };

  /**
   * HÀM CHE EMAIL ĐỂ BẢO MẬT
   *
   * VÍ DỤ: "user@gmail.com" -> "us****@gmail.com"
   * LOGIC: Giữ 2 ký tự đầu, thay phần giữa bằng dấu *
   */
  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(?=@)/, (_, first, rest) => {
        return first + "*".repeat(rest.length);
      })
    : "email của bạn";

  // Ảnh lỗi
  const ERROR_IMG_SRC =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==";

  // --- BƯỚC 4: TRẢ VỀ JSX CỦA OTPFORM ---
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side - Visual */}
      <div
        className="hidden md:flex md:w-1/2 relative overflow-hidden"
        style={{ backgroundColor: "#00416A" }} // Màu nền tối
      >
        {/* Background Image with Fallback */}
        {imageError ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-900 opacity-20">
            <img
              src={ERROR_IMG_SRC}
              alt="Error loading image"
              className="w-20 h-20"
            />
          </div>
        ) : (
          <img
            src="https://images.unsplash.com/photo-1563986768609-322da13575f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
            alt="Email verification"
            className="w-full h-full object-cover opacity-20"
            onError={() => setImageError(true)}
          />
        )}

        {/* Overlay Content */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center"
          style={{ color: "#F0EAD6" }} // Màu chữ sáng
        >
          <div className="max-w-md space-y-8">
            {/* Icon */}
            <div className="flex justify-center">
              <div
                className="rounded-full p-6"
                style={{ backgroundColor: "rgba(240, 234, 214, 0.1)" }}
              >
                <Mail className="w-16 h-16" style={{ color: "#F0EAD6" }} />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-4">
              <h1 className="text-4xl">Xác thực email</h1>
              <p className="text-lg opacity-90">
                Chúng tôi đã gửi mã xác thực 6 số đến email của bạn
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4 text-left">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-medium">Bảo mật tài khoản</h3>
                  <p className="text-sm opacity-80">
                    Xác thực 2 lớp để bảo vệ tài khoản của bạn
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-6 h-6 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-medium">Hiệu lực 5 phút</h3>
                  <p className="text-sm opacity-80">
                    Mã OTP có hiệu lực trong vòng 5 phút
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative circles */}
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10"
          style={{ backgroundColor: "#F0EAD6" }}
        ></div>
        <div
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-10"
          style={{ backgroundColor: "#F0EAD6" }}
        ></div>
      </div>

      {/* Right Side - OTP Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Logo for mobile */}
          <div className="flex justify-center md:hidden mb-8">
            <div className="flex items-center gap-2">
              <Mail className="h-8 w-8" style={{ color: "#00416A" }} />
              <span className="text-2xl" style={{ color: "#00416A" }}>
                Tora Novel
              </span>
            </div>
          </div>

          {/* Header */}
          <div className="space-y-2 text-center">
            <h2 className="text-3xl">Nhập mã OTP</h2>
            <p className="text-muted-foreground">Mã xác thực đã được gửi đến</p>
            <p className="font-medium">{maskedEmail}</p>
            {/* Hiển thị email đã che */}
          </div>

          {/* OTP Form */}
          <form onSubmit={handleSubmitForm} className="space-y-6">
            {/* OTP Input */}
            <div className="flex flex-col items-center space-y-4">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={handleOTPChange}
                disabled={isLoading}
              >
                <InputOTPGroup>
                  {/* 6 ô nhập OTP */}
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              <p className="text-sm text-muted-foreground">
                Vui lòng nhập mã 6 số từ email
              </p>
            </div>

            {/* Countdown / Resend */}
            <div className="text-center space-y-2">
              {!canResend ? (
                // Hiển thị thời gian đếm ngược
                <p className="text-sm text-muted-foreground">
                  Gửi lại mã sau{" "}
                  <span className="font-medium text-foreground">
                    {formatCountdown(countdown)}
                  </span>
                </p>
              ) : (
                // Hiển thị nút gửi lại khi hết thời gian
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isLoading}
                  className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-2 transition-colors"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Gửi lại mã OTP
                </button>
              )}
            </div>

            {/* Submit Button (Tự động submit, nhưng giữ lại phòng trường hợp người dùng muốn nhấn) */}
            <Button
              type="submit"
              className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              disabled={otp.length !== 6 || isLoading} // Disable khi chưa đủ 6 số hoặc đang loading
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Đang xác thực...
                </div>
              ) : (
                "Xác thực"
              )}
            </Button>

            {/* Back Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Quay lại
            </Button>
          </form>

          {/* Help Text */}
          <div className="pt-4">
            <div className="rounded-lg border bg-muted p-4 space-y-3">
              <p className="text-sm font-medium text-center text-foreground">
                Không nhận được email?
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span
                    className="text-xs mt-1 text-primary"
                    style={{ color: "#00416A" }}
                  >
                    •
                  </span>
                  <span>
                    Kiểm tra thư mục <strong>Spam/Junk</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span
                    className="text-xs mt-1 text-primary"
                    style={{ color: "#00416A" }}
                  >
                    •
                  </span>
                  <span>Đảm bảo email đã nhập chính xác</span>
                </li>
                <li className="flex items-start gap-2">
                  <span
                    className="text-xs mt-1 text-primary"
                    style={{ color: "#00416A" }}
                  >
                    •
                  </span>
                  <span>
                    Mã OTP có hiệu lực trong <strong>5 phút</strong>
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
