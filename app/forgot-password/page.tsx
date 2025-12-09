//app/forgot-password/page.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mail,
  ShieldCheck,
  Clock,
  ArrowLeft,
  RefreshCw,
  Send,
} from "lucide-react";
import { authService } from "@/services/authService";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [imageError, setImageError] = useState(false);

  const ERROR_IMG_SRC =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==";
  // --- HELPER: Xử lý lỗi API ---
  const handleApiError = (error: any, defaultMessage: string) => {
    // 1. Check lỗi Validation/Logic từ Backend
    if (error.response && error.response.data && error.response.data.error) {
      const { message, details } = error.response.data.error;

      // Ưu tiên Validation (details)
      if (details) {
        const firstKey = Object.keys(details)[0];
        if (firstKey && details[firstKey].length > 0) {
          // --- SỬA CHỖ NÀY ---
          // Dùng .join(' ') để nối tất cả thông báo lỗi lại thành một câu nguyên văn
          // Thay vì lấy [0] chỉ được 1 dòng.
          const msg = details[firstKey].join(" ");

          toast.error(msg);
          setError(msg); // Hiện khung đỏ
          return;
        }
      }

      // Message từ Backend
      if (message) {
        toast.error(message);
        setError(message);
        return;
      }
    }

    // 2. Fallback
    const fallbackMsg = error.response?.data?.message || defaultMessage;
    toast.error(fallbackMsg);
    setError(fallbackMsg);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await authService.forgotPassword({ email });

      toast.success(
        "Đã gửi mã OTP thành công. Vui lòng kiểm tra email của bạn."
      );

      router.push(`/reset-password?email=${email}`);
      // } catch (err: any) {
      //   const errMsg =
      //     err.response?.data?.message ||
      //     "Gửi yêu cầu thất bại. Vui lòng thử lại.";
      //   setError(errMsg);
      //   toast.error(errMsg);
      //   setIsLoading(false);
      // }
    } catch (error: any) {
      // ---  ---
      handleApiError(error, "Gửi yêu cầu thất bại. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* --- LEFT SIDE  --- */}
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
              {/* Giữ nội dung của verify-otp cho nhất quán layout */}
              <h1 className="text-4xl">Xác thực email</h1>
              <p className="text-lg opacity-90">
                Chúng tôi sẽ gửi mã xác thực 6 số đến email của bạn
              </p>
            </div>

            {/* Features (từ verify-otp) */}
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

        {/* Decorative circles (từ verify-otp) */}
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10"
          style={{ backgroundColor: "#F0EAD6" }}
        ></div>
        <div
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-10"
          style={{ backgroundColor: "#F0EAD6" }}
        ></div>
      </div>
      {/* --- KẾT THÚC LEFT SIDE --- */}

      {/* --- RIGHT SIDE (FORM ) --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            disabled={isLoading}
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </button>

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div
                // Dùng class của shadcn
                className="w-16 h-16 rounded-full flex items-center justify-center bg-primary/10"
              >
                {/* Dùng icon Send thay cho KeyRound */}
                <Send className="w-8 h-8 text-primary" />
              </div>
            </div>
            {/* Dùng class của shadcn */}
            <h2 className="text-3xl text-primary">Tìm tài khoản của bạn</h2>
            <p className="text-sm text-muted-foreground">
              Vui lòng nhập địa chỉ email bạn đã sử dụng để đăng ký.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              {/* Bỏ style, dùng class Label mặc định */}
              <Label htmlFor="email">Địa chỉ Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="h-11" // Bỏ style border
              />
            </div>

            {/* Error Message */}
            {error && (
              <div
                className="rounded-lg p-3 text-sm"
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  color: "#dc2626",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                }}
              >
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 hover:opacity-90 gap-2"
              style={{ backgroundColor: "#F0EAD6", color: "#00416A" }}
              disabled={!email || isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Gửi mã khôi phục
                </>
              )}
            </Button>
          </form>

          {/* Info Box  */}
          <div className="rounded-lg p-4 space-y-2 bg-muted border">
            <p className="text-sm font-medium text-primary">Lưu ý:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Chỉ nhập email đã đăng ký.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Mã OTP gửi qua email có hiệu lực trong 5 phút.</span>
              </li>
            </ul>
          </div>

          {/* Mobile Logo */}
          <div className="lg:hidden text-center pt-8 border-t">
            <h3 className="text-2xl mb-2 text-primary">Tora Novel</h3>
            <p className="text-sm text-muted-foreground">
              Nền tảng đọc truyện tương tác với AI Voice
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
