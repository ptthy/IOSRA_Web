"use client";

import React, { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BookOpen,
  Volume2,
  Headphones,
  KeyRound,
  Eye,
  EyeOff,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { authService } from "@/services/authService";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Đang tải...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email"); // <-- Get email from URL

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (otp.length !== 6) {
      setError("Mã OTP phải có 6 chữ số");
      return;
    }

    if (newPassword.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    if (!email) {
      setError(
        "Không tìm thấy địa chỉ email. Vui lòng thử lại từ bước Quên mật khẩu."
      );
      toast.error(
        "Không tìm thấy địa chỉ email. Vui lòng thử lại từ bước Quên mật khẩu."
      );
      // Optionally redirect back
      // router.push("/forgot-password");
      return;
    }
    setIsLoading(true);

    try {
      // Call the resetPassword API
      await authService.resetPassword({
        email, // Use email from URL
        otp,
        newPassword,
        confirmNewPassword: confirmPassword, // API expects confirmNewPassword
      });

      toast.success("Đặt lại mật khẩu thành công! Vui lòng đăng nhập.");

      // Redirect to the login page on success
      router.push("/login");
    } catch (err: any) {
      // Handle API errors
      const errMsg =
        err.response?.data?.message ||
        "Đặt lại mật khẩu thất bại. Mã OTP có thể sai hoặc hết hạn.";
      setError(errMsg);
      toast.error(errMsg);
      setIsLoading(false); // Stop loading on error
    }
    // No need to set isLoading false on success due to redirect
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Visual */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12"
        style={{ backgroundColor: "#00416A" }}
      >
        <div className="relative z-10 max-w-lg text-center">
          {/* Logo/Brand */}
          <div className="mb-8">
            <h1 className="text-5xl mb-4" style={{ color: "#F0EAD6" }}>
              Tora Novel
            </h1>
            <p
              className="text-xl"
              style={{ color: "rgba(240, 234, 214, 0.8)" }}
            >
              Nền tảng đọc truyện tương tác với AI Voice
            </p>
          </div>

          {/* Visual Icons */}
          <div className="flex justify-center gap-12 mb-12">
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(240, 234, 214, 0.15)" }}
              >
                <BookOpen className="w-10 h-10" style={{ color: "#F0EAD6" }} />
              </div>
              <p
                className="text-sm"
                style={{ color: "rgba(240, 234, 214, 0.8)" }}
              >
                Đọc truyện
              </p>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(240, 234, 214, 0.15)" }}
              >
                <Volume2 className="w-10 h-10" style={{ color: "#F0EAD6" }} />
              </div>
              <p
                className="text-sm"
                style={{ color: "rgba(240, 234, 214, 0.8)" }}
              >
                AI Voice
              </p>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(240, 234, 214, 0.15)" }}
              >
                <Headphones
                  className="w-10 h-10"
                  style={{ color: "#F0EAD6" }}
                />
              </div>
              <p
                className="text-sm"
                style={{ color: "rgba(240, 234, 214, 0.8)" }}
              >
                Audiobook
              </p>
            </div>
          </div>

          {/* Feature Text */}
          <div className="space-y-4">
            <p
              className="text-lg"
              style={{ color: "rgba(240, 234, 214, 0.9)" }}
            >
              Đặt lại mật khẩu mới
            </p>
            <p
              className="text-sm"
              style={{ color: "rgba(240, 234, 214, 0.7)" }}
            >
              Nhập mã OTP đã gửi đến email và tạo mật khẩu mới của bạn
            </p>
          </div>
        </div>

        {/* Decorative Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm transition-colors hover:opacity-70"
            style={{ color: "#00416A" }}
            disabled={isLoading}
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </button>

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(0, 65, 106, 0.1)" }}
              >
                <KeyRound className="w-8 h-8" style={{ color: "#00416A" }} />
              </div>
            </div>
            <h2 className="text-3xl" style={{ color: "#00416A" }}>
              Đặt lại mật khẩu
            </h2>
            <p className="text-sm text-muted-foreground">
              Mã OTP đã được gửi đến{" "}
              <span style={{ color: "#00416A" }}>{email}</span>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP Field */}
            <div className="space-y-2">
              <Label htmlFor="otp" style={{ color: "#00416A" }}>
                Mã OTP (6 chữ số)
              </Label>
              <Input
                id="otp"
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                required
                disabled={isLoading}
                className="h-11 text-center text-2xl tracking-widest"
                style={{
                  borderColor: "rgba(0, 65, 106, 0.2)",
                }}
                maxLength={6}
              />
            </div>

            {/* New Password Field */}
            <div className="space-y-2">
              <Label htmlFor="newPassword" style={{ color: "#00416A" }}>
                Mật khẩu mới
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Ít nhất 6 ký tự"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 pr-10"
                  style={{
                    borderColor: "rgba(0, 65, 106, 0.2)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={isLoading}
                >
                  {showNewPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" style={{ color: "#00416A" }}>
                Xác nhận mật khẩu mới
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 pr-10"
                  style={{
                    borderColor: "rgba(0, 65, 106, 0.2)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
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
              className="w-full h-12 hover:opacity-90"
              style={{ backgroundColor: "#F0EAD6", color: "#00416A" }}
              disabled={!otp || !newPassword || !confirmPassword || isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Đang xử lý...
                </div>
              ) : (
                "Đặt lại mật khẩu"
              )}
            </Button>
          </form>

          {/* Info Box */}
          <div
            className="rounded-lg p-4 space-y-2"
            style={{
              backgroundColor: "rgba(0, 65, 106, 0.05)",
              border: "1px solid rgba(0, 65, 106, 0.1)",
            }}
          >
            <p className="text-sm font-medium" style={{ color: "#00416A" }}>
              Yêu cầu mật khẩu:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-start gap-2">
                <span style={{ color: "#00416A" }}>•</span>
                <span>Ít nhất 6 ký tự</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: "#00416A" }}>•</span>
                <span>Mã OTP có hiệu lực trong 5 phút</span>
              </li>
            </ul>
          </div>

          {/* Mobile Logo */}
          <div className="lg:hidden text-center pt-8 border-t">
            <h3 className="text-2xl mb-2" style={{ color: "#00416A" }}>
              Tora Novel
            </h3>
            <p className="text-sm text-muted-foreground">
              Nền tảng đọc truyện tương tác với AI Voice
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
