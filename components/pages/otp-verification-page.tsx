"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Mail, ShieldCheck, Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/services/authService";
export function OTPVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Đang tải...
        </div>
      }
    >
      <OTPForm />
    </Suspense>
  );
}
function OTPForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email"); // <-- 6. Get email from URL

  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Countdown timer logic (no changes needed)
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // const handleVerify = async (e: React.FormEvent) => {
  //   e.preventDefault();

  //   if (otp.length !== 6) {
  //     toast.error("Vui lòng nhập đủ 6 số!");
  //     return;
  //   }

  //   setIsLoading(true);

  //   try {
  //     // Call the verifyOtp API
  //     await authService.verifyOtp({ email, otp: otpValue });

  //     toast.success("Xác thực thành công! Vui lòng đăng nhập.");
  //     router.push("/login"); // Redirect to login page on success
  //   } catch (err: any) {
  //     // Handle API errors
  //     toast.error(
  //       err.response?.data?.message || "Mã OTP không đúng hoặc đã hết hạn."
  //     );
  //     setIsLoading(false); // Stop loading on error
  //     setOtp(""); // Clear the OTP input on error
  //   }
  //   // No need to set isLoading false on success due to redirect
  // };
  const handleVerify = async (otpValue: string) => {
    if (otpValue.length !== 6) {
      toast.error("Vui lòng nhập đủ 6 số!");
      return;
    }
    if (!email) {
      toast.error("Không tìm thấy địa chỉ email. Vui lòng quay lại.");
      router.push("/register"); // Hoặc trang login/register phù hợp
      return;
    }
    setIsLoading(true);

    try {
      // Bây giờ email chắc chắn là string, otpValue cũng là string
      await authService.verifyOtp({ email, otp: otpValue });
      toast.success("Xác thực thành công! Vui lòng đăng nhập.");
      router.push("/login");
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Mã OTP không đúng hoặc hết hạn."
      );
      setIsLoading(false);
      setOtp("");
    }
  };

  // Wrapper function for the form's onSubmit event
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify(otp);
  };
  const handleResend = async () => {
    if (!canResend || !email) return; // Don't resend if not allowed or no email

    setIsLoading(true); // Show loading state on the button
    try {
      await authService.forgotPassword({ email });

      // Reset timer and state
      setCountdown(300);
      setCanResend(false);
      setOtp(""); // Clear any entered OTP
      toast.success("Mã OTP mới đã được gửi!");
    } catch (err: any) {
      // Handle API errors during resend
      toast.error(err.response?.data?.message || "Gửi lại mã thất bại.");
    } finally {
      setIsLoading(false); // Stop loading regardless of success/failure
    }
  };
  // Format countdown thành MM:SS
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleOTPChange = (value: string) => {
    setOtp(value);

    if (value.length === 6) {
      handleVerify(value); // Call the updated verify function
    }
  };

  // Mask email for privacy
  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(?=@)/, (_, first, rest) => {
        return first + "*".repeat(rest.length);
      })
    : "email của bạn";

  // Error image SVG (base64)
  const ERROR_IMG_SRC =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==";

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side - Visual */}
      <div
        className="hidden md:flex md:w-1/2 relative overflow-hidden"
        style={{ backgroundColor: "#00416A" }}
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
          style={{ color: "#F0EAD6" }}
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
                <p className="text-sm text-muted-foreground">
                  Gửi lại mã sau{" "}
                  <span className="font-medium text-foreground">
                    {formatCountdown(countdown)}
                  </span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isLoading}
                  className="text-sm font-medium hover:underline inline-flex items-center gap-2 transition-colors"
                  //  style={{ color: "#00416A" }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Gửi lại mã OTP
                </button>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              disabled={otp.length !== 6 || isLoading}
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
                  <span className="text-xs mt-1" style={{ color: "#00416A" }}>
                    •
                  </span>
                  <span>
                    Kiểm tra thư mục <strong>Spam/Junk</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-xs mt-1" style={{ color: "#00416A" }}>
                    •
                  </span>
                  <span>Đảm bảo email đã nhập chính xác</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-xs mt-1" style={{ color: "#00416A" }}>
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
