//app/google-complete/page.tsx
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BookOpen,
  Volume2,
  Headphones,
  UserPlus,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/authService";
import { toast } from "sonner";

export default function GoogleCompleteRoute() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Đang tải...
        </div>
      }
    >
      <GoogleCompleteContent />
    </Suspense>
  );
}

function GoogleCompleteContent() {
  // Logic từ route
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const idToken = searchParams.get("idToken") || "";
  const googleEmail = searchParams.get("email") || "";

  // State loading/lỗi từ route
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // State của form (đã chuyển từ UI component vào đây)
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [imageError, setImageError] = useState(false);

  // useEffect từ route (kiểm tra params)
  useEffect(() => {
    if (!idToken || !googleEmail) {
      toast.error("Thiếu thông tin Google. Đang chuyển về trang đăng nhập...");
      router.push("/login");
    }
  }, [idToken, googleEmail, router]);
  // --- HELPER: Xử lý lỗi API ---
  const handleApiError = (err: any, defaultMessage: string) => {
    // 1. Check lỗi Validation/Logic từ Backend (cấu trúc nested)
    if (err.response && err.response.data && err.response.data.error) {
      const { message, details } = err.response.data.error;

      // Ưu tiên Validation (details): Lấy lỗi đầu tiên ra hiển thị
      if (details) {
        const firstKey = Object.keys(details)[0];
        if (firstKey && details[firstKey].length > 0) {
          const msg = details[firstKey].join(" ");
          toast.error(msg);
          setError(msg); // Cập nhật state để hiện khung đỏ
          return;
        }
      }

      // Message chung từ Backend
      if (message) {
        toast.error(message);
        setError(message);
        return;
      }
    }

    // 2. Fallback (Lỗi mạng hoặc lỗi không xác định)
    const fallbackMsg = err.response?.data?.message || defaultMessage;
    toast.error(fallbackMsg);
    setError(fallbackMsg);
  };

  // Hàm handler từ route (sẽ dùng cho onSubmit của form)
  const handleCompleteRegistration = async (
    e: React.FormEvent // Cập nhật để nhận event
  ) => {
    e.preventDefault(); // Thêm e.preventDefault()
    setError(""); // Xóa lỗi cũ

    // Validation (từ route)
    if (username.length < 6) {
      setError("Username phải có ít nhất 6 ký tự");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    setIsLoading(true); // Bắt đầu loading
    try {
      // 1. Gọi API hoàn tất đăng ký bằng authService
      await authService.completeGoogleLogin({
        idToken,
        username,
        password,
        confirmPassword,
      });

      toast.success("Hoàn tất đăng ký! Đang tự động đăng nhập...");

      // 2. Gọi hàm login từ AuthContext để đăng nhập người dùng
      await login({ identifier: googleEmail, password: password });
      // AuthContext sẽ tự xử lý cập nhật state và chuyển hướng về "/"
      // } catch (err: any) {
      //   // Xử lý lỗi từ API
      //   const errMsg =
      //     err.response?.data?.message || // Lỗi cụ thể từ backend
      //     "Hoàn tất đăng ký thất bại. Username có thể đã tồn tại hoặc có lỗi xảy ra.";
      //   setError(errMsg); // Cập nhật state lỗi để hiển thị
      //   toast.error(errMsg);
      //   setIsLoading(false); // Dừng loading khi có lỗi
      // }
    } catch (err: any) {
      // --- THay đổi  CHỖ NÀY ---
      handleApiError(err, "Hoàn tất đăng ký thất bại. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  // Error image (từ UI component)
  const ERROR_IMG_SRC =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==";

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0">
          {imageError ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 opacity-20">
              <img
                src={ERROR_IMG_SRC}
                alt="Error loading image"
                className="w-20 h-20"
              />
            </div>
          ) : (
            <img
              src="https://images.unsplash.com/photo-1543244916-b3da1ba6252c"
              alt="Reading experience"
              className="w-full h-full object-cover opacity-20"
              onError={() => setImageError(true)}
            />
          )}
        </div>
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-primary-foreground">
          <div className="max-w-md text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-foreground/20 backdrop-blur-sm mb-4">
              <BookOpen className="h-10 w-10" />
            </div>
            <h1 className="text-5xl">Tora Novel</h1>
            <h2 className="text-2xl">Chào mừng đến với</h2>
            <p className="text-xl">
              Nền tảng đọc truyện tương tác với AI Voice
            </p>
            <div className="flex justify-center gap-8 pt-8">
              <div className="flex flex-col items-center gap-2">
                <Volume2 className="h-8 w-8" />
                <span className="text-sm">AI Voice</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Headphones className="h-8 w-8" />
                <span className="text-sm">Audiobook</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <BookOpen className="h-8 w-8" />
                <span className="text-sm">Ebook</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background text-foreground">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-muted">
                <UserPlus className="w-8 h-8" />
              </div>
            </div>
            <h2 className="text-3xl">Hoàn tất đăng ký</h2>
            <p className="text-sm text-muted-foreground">
              Đăng nhập với Google:{" "}
              {/* Sử dụng biến 'googleEmail' từ state/params */}
              <span className="font-medium text-primary">{googleEmail}</span>
            </p>
          </div>

          {/* Form: Sửa onSubmit thành 'handleCompleteRegistration' */}
          <form onSubmit={handleCompleteRegistration} className="space-y-6">
            {/* Username Field */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Tên hiển thị của bạn"
                value={username} // Dùng state local
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading} // Dùng state local
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                Tên này sẽ hiển thị công khai trên Tora Novel
              </p>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ít nhất 6 ký tự"
                  value={password} // Dùng state local
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading} // Dùng state local
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isLoading} // Dùng state local
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Tạo mật khẩu để bảo mật tài khoản của bạn
              </p>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword} // Dùng state local
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading} // Dùng state local
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isLoading} // Dùng state local
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message: Dùng state local 'error' */}
            {error && (
              <div className="rounded-lg p-3 text-sm text-destructive border border-destructive/20 bg-destructive/10">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              disabled={
                !username || !password || !confirmPassword || isLoading // Dùng state local
              }
            >
              {isLoading ? ( // Dùng state local
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Đang hoàn tất...
                </div>
              ) : (
                "Hoàn tất đăng ký"
              )}
            </Button>
          </form>

          {/* Info Box */}
          <div className="rounded-lg p-4 space-y-2 bg-muted border">
            <p className="text-sm font-medium">Lưu ý:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Username phải có ít nhất 3 ký tự</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Mật khẩu phải có ít nhất 6 ký tự</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Bạn có thể dùng Google để đăng nhập sau này</span>
              </li>
            </ul>
          </div>

          {/* Mobile Logo */}
          <div className="lg:hidden text-center pt-8 border-t">
            <h3 className="text-2xl mb-2">Tora Novel</h3>
            <p className="text-sm text-muted-foreground">
              Nền tảng đọc truyện tương tác với AI Voice
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
