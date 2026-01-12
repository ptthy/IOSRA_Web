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
/**
 * Trang hoàn tất đăng ký bằng Google
 *
 * MỤC ĐÍCH:
 * - Khi người dùng đăng nhập bằng Google lần đầu, backend trả về mã lỗi 409/404
 * - Người dùng được chuyển hướng đến trang này để bổ sung thông tin (username, password)
 * - Sau khi hoàn tất, hệ thống tự động đăng nhập và chuyển hướng về trang chủ
 *
 * QUY TRÌNH:
 * 1. Nhận idToken và email từ URL params (chuyển từ trang login)
 * 2. Hiển thị form để người dùng nhập username và password
 * 3. Gọi API completeGoogleLogin để hoàn tất đăng ký
 * 4. Tự động đăng nhập bằng thông tin vừa tạo
 * 5. Chuyển hướng về trang chủ
 *
 * LIÊN THÔNG VỚI:
 * - /app/login/page.tsx: Nhận idToken và email từ query params
 * - @/services/authService: Gọi API completeGoogleLogin
 * - @/context/AuthContext: Sử dụng hàm login để tự động đăng nhập
 */

// Sử dụng Suspense để xử lý loading khi useSearchParams chưa sẵn sàng
// Next.js 15+ yêu cầu Suspense khi dùng useSearchParams trong Server Components
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

// Component chính xử lý logic hoàn tất đăng ký
function GoogleCompleteContent() {
  // Lấy router và searchParams để lấy thông tin từ URL
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth(); // Lấy hàm login từ AuthContext để đăng nhập sau khi hoàn tất

  // Lấy idToken và email từ query params (truyền từ trang đăng nhập)
  const idToken = searchParams.get("idToken") || "";
  const googleEmail = searchParams.get("email") || "";

  // State quản lý trạng thái loading và lỗi
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // State quản lý các trường nhập liệu trong form
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // State quản lý hiển thị mật khẩu
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // State quản lý lỗi tải ảnh
  const [imageError, setImageError] = useState(false);
  /**
   * useEffect kiểm tra tham số URL
   *
   * LOGIC:
   * - Nếu thiếu idToken hoặc email -> đây là truy cập bất hợp lệ
   * - Hiển thị thông báo lỗi và chuyển hướng về trang đăng nhập
   * - Ngăn người dùng truy cập trực tiếp mà không qua flow Google
   */
  useEffect(() => {
    if (!idToken || !googleEmail) {
      toast.error("Thiếu thông tin Google. Đang chuyển về trang đăng nhập...");
      router.push("/login");
    }
  }, [idToken, googleEmail, router]);
  /**
   * Hàm xử lý lỗi API thống nhất
   *
   * XỬ LÝ THEO THỨ TỰ ƯU TIÊN:
   * 1. Lỗi Validation từ Backend (có details) -> hiển thị lỗi chi tiết
   * 2. Lỗi message chung từ Backend -> hiển thị message
   * 3. Lỗi mạng/không xác định -> hiển thị thông báo mặc định
   *
   * CẤU TRÚC LỖI BACKEND DỰ KIẾN:
   * {
   *   error: {
   *     message: "Tổng quan lỗi",
   *     details: {
   *       username: ["Username đã tồn tại"],
   *       password: ["Mật khẩu quá yếu"]
   *     }
   *   }
   * }
   */
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

  /**
   * Hàm xử lý submit form hoàn tất đăng ký
   *
   * QUY TRÌNH:
   * 1. Ngăn reload trang với e.preventDefault()
   * 2. Validation cơ bản phía client
   * 3. Gọi API completeGoogleLogin với 4 tham số bắt buộc
   * 4. Nếu thành công -> tự động đăng nhập bằng hàm login
   * 5. Nếu thất bại -> hiển thị lỗi bằng handleApiError
   */
  const handleCompleteRegistration = async (
    e: React.FormEvent // Cập nhật để nhận event
  ) => {
    e.preventDefault(); // Ngăn chặn reload trang
    setError(""); // Xóa lỗi cũ

    // VALIDATION PHÍA CLIENT (để giảm request không cần thiết)
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
      // Tham số: idToken từ Google + thông tin bổ sung từ người dùng
      await authService.completeGoogleLogin({
        idToken,
        username,
        password,
        confirmPassword,
      });

      toast.success("Hoàn tất đăng ký! Đang tự động đăng nhập...");

      // 2. Tự động đăng nhập với thông tin vừa tạo
      // Dùng email từ Google làm identifier và password vừa nhập
      await login({ identifier: googleEmail, password: password });
      // LƯU Ý: Hàm login trong AuthContext sẽ tự xử lý:
      // - Lưu token vào localStorage
      // - Cập nhật context
      // - Chuyển hướng dựa trên role
    } catch (err: any) {
      // Xử lý lỗi chi tiết từ API
      handleApiError(err, "Hoàn tất đăng ký thất bại. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false); // Luôn tắt loading dù thành công hay thất bại
    }
  };

  // Ảnh fallback dạng base64 SVG khi ảnh Unsplash bị lỗi
  const ERROR_IMG_SRC =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==";

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0">
          {imageError ? (
            // Hiển thị ảnh fallback khi ảnh chính bị lỗi
            <div className="w-full h-full flex items-center justify-center bg-gray-100 opacity-20">
              <img
                src={ERROR_IMG_SRC}
                alt="Error loading image"
                className="w-20 h-20"
              />
            </div>
          ) : (
            // Ảnh background chính
            <img
              src="https://images.unsplash.com/photo-1543244916-b3da1ba6252c"
              alt="Reading experience"
              className="w-full h-full object-cover opacity-20"
              onError={() => setImageError(true)} // Xử lý lỗi tải ảnh
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
