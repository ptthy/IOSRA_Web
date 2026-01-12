// app/login/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Volume2,
  Headphones,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";
import { jwtDecode } from "jwt-decode";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";

/**
 * Trang đăng nhập chính của ứng dụng
 *
 * MỤC ĐÍCH:
 * - Cung cấp 2 phương thức đăng nhập: Email/Password và Google OAuth
 * - Xử lý authentication và redirect dựa trên role người dùng
 * - Xử lý trường hợp tài khoản Google chưa đăng ký (chuyển đến trang hoàn tất)
 *
 * QUY TRÌNH ĐĂNG NHẬP GOOGLE:
 * 1. Người dùng click "Đăng nhập với Google"
 * 2. Mở popup Firebase Authentication
 * 3. Lấy idToken từ Firebase
 * 4. Gửi idToken đến backend (/api/auth/google)
 * 5. Backend kiểm tra:
 *    - Nếu tài khoản đã tồn tại -> trả về token và user data
 *    - Nếu chưa tồn tại -> trả về 409/404 -> chuyển đến trang hoàn tất
 *
 * LIÊN THÔNG VỚI:
 * - @/context/AuthContext: Lưu thông tin đăng nhập và token
 * - @/lib/firebase: Xác thực Google qua Firebase
 * - @/services/authService: Gọi API login và loginWithGoogle
 * - /app/google-complete/page.tsx: Khi tài khoản Google chưa đăng ký
 */

/**
 * Helper function: Xác định role chính từ danh sách roles
 *
 * LOGIC ƯU TIÊN:
 * admin > omod > cmod > author > reader
 *
 * MỤC ĐÍCH:
 * - Người dùng có thể có nhiều role (ví dụ: vừa là author vừa là cmod)
 * - Hệ thống cần xác định role "quyền lực nhất" để redirect đúng trang
 *
 * @param roles - Mảng các role của người dùng
 * @returns Role chính để điều hướng
 */
const getPrimaryRole = (roles: string[]): string => {
  // Ưu tiên các role theo thứ tự: admin > omod > cmod > author > reader
  // Kiểm tra mảng rỗng hoặc undefined
  if (!roles || roles.length === 0) return "reader";
  // Logic ưu tiên theo thứ tự
  if (roles.includes("admin")) return "admin";
  if (roles.includes("omod")) return "omod";
  if (roles.includes("cmod")) return "cmod";
  if (roles.includes("author")) return "author";
  // Fallback về role đầu tiên hoặc "reader"
  return roles[0] || "reader";
};

// Component chính của trang đăng nhập
export default function LoginRoute() {
  // Lấy hàm login và setAuthData từ AuthContext
  const { login, setAuthData } = useAuth();
  const router = useRouter();

  // State quản lý các trường nhập liệu
  const [identifier, setIdentifier] = useState(""); // Nhận cả email hoặc username
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * useEffect reset form khi component mount
   *
   * MỤC ĐÍCH:
   * - Phòng trường hợp trình duyệt tự động điền thông tin cũ
   * - Đảm bảo form luôn bắt đầu từ trạng thái trống
   */
  useEffect(() => {
    setIdentifier("");
    setPassword("");
  }, []);

  /**
   * Hàm xử lý đăng nhập với email/password
   *
   * QUY TRÌNH:
   * 1. Ngăn reload trang với e.preventDefault()
   * 2. Gọi hàm login từ AuthContext (xử lý authentication)
   * 3. AuthContext sẽ tự động:
   *    - Gọi API login
   *    - Lưu token vào localStorage
   *    - Cập nhật context
   *    - Redirect dựa trên role
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Gọi hàm login từ AuthContext
      // AuthContext sẽ xử lý toàn bộ flow đăng nhập
      await login({ identifier: identifier, password });
      // Nếu thành công, AuthContext sẽ tự động redirect dựa trên role
    } catch (err: any) {
      setIsLoading(false);
      // Xử lý lỗi chi tiết từ server
      const serverMsg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        "Đăng nhập thất bại. Vui lòng thử lại.";

      // Ưu tiên hiển thị lỗi validation chi tiết (details)
      const details = err.response?.data?.error?.details;
      if (details) {
        const firstKey = Object.keys(details)[0];
        toast.error(details[firstKey][0]);
      } else {
        //toast.error(serverMsg); // Sẽ hiện "Tài khoản chưa đăng ký..."
      }

      console.error("Login Error:", err);
    }
  };

  /**
   * Hàm xử lý đăng nhập với Google OAuth
   *
   * QUY TRÌNH CHI TIẾT:
   * 1. Tạo GoogleAuthProvider và mở popup đăng nhập
   * 2. Lấy Firebase idToken từ kết quả
   * 3. Gửi idToken đến backend API /api/auth/google
   * 4. Backend xử lý:
   *    a. Xác thực idToken với Google
   *    b. Kiểm tra user đã tồn tại trong DB chưa
   *    c. Nếu tồn tại -> trả về user data và token
   *    d. Nếu chưa tồn tại -> trả về 409/404
   * 5. Frontend xử lý response:
   *    a. Nếu thành công -> lưu thông tin vào AuthContext
   *    b. Nếu lỗi 409/404 -> redirect đến trang hoàn tất đăng ký
   */
  const signInWithGoogle = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      // 1. Mở popup đăng nhập Firebase
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // 2. Lấy idToken từ Firebase (dùng để xác thực với backend)
      const idToken = await user.getIdToken();
      // 3. Gửi idToken đến backend để xác thực
      const response = await authService.loginWithGoogle({ idToken });
      const {
        username,
        email,
        token: backendToken,
        roles,
        displayName,
        avatar,
      } = response.data;
      console.log(response.data);

      // 4. Kiểm tra dữ liệu trả về
      if (backendToken && username && email) {
        // Decode JWT token để lấy thông tin
        const decodedPayload: any = jwtDecode(backendToken);

        // Xử lý roles: đảm bảo là mảng và chuyển thành chữ thường
        const userRoles = (Array.isArray(roles) ? roles : [roles]).map(
          (r: string) => r.toLowerCase().trim()
        );
        const primaryRole = getPrimaryRole(userRoles); // Xác định role chính

        // Tạo object user để lưu vào context
        const userToSet = {
          id: decodedPayload.sub, // ID từ token JWT
          username: username,
          email: email,
          role: primaryRole, // Role chính để điều hướng
          roles: userRoles, // Toàn bộ roles để kiểm tra quyền
          displayName: displayName || username,
          avatar: avatar,
        };
        // 5. Lưu thông tin đăng nhập vào AuthContext
        // Hàm này sẽ tự động lưu vào localStorage và cập nhật state
        setAuthData(userToSet, backendToken);
      } else {
        toast.error("Đăng nhập Google thất bại: Dữ liệu thiếu.");
        setIsLoading(false);
      }
    } catch (err: any) {
      setIsLoading(false);

      // 1. Lấy message lỗi từ server (Bất kể lỗi gì: 404, 409, 500...)
      const serverMsg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        "Đăng nhập thất bại.";

      // 2. Hiện toast lỗi đó ra luôn
      toast.error(serverMsg);

      // Nếu là lỗi 409 (Tài khoản chưa đăng ký/Xung đột) -> đá sang trang register
      if (err.response?.status === 409) {
        router.push("/register");
      }
      // Nếu là lỗi 404 (Không tìm thấy) ->
      else if (err.response?.status === 404) {
        router.push("/register");
      }
      // Các lỗi khác như đóng popup Google
      else if (err.code === "auth/popup-closed-by-user") {
        toast.info("Bạn đã đóng cửa sổ đăng nhập Google.");
      }
    }
  };
  // Ảnh fallback khi ảnh chính bị lỗi
  const ERROR_IMG_SRC =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==";

  return (
    <div className="min-h-screen flex">
      {/* Left Side */}
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

      {/* Right Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Header */}
          <div className="lg:hidden text-center">
            <h1 className="text-3xl text-primary mb-2">Tora Novel</h1>
            <p className="text-muted-foreground">
              Nền tảng đọc truyện với AI Voice
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2 text-center lg:text-left">
              <h2 className="text-3xl">Đăng nhập</h2>
              <p className="text-muted-foreground">
                Nhập thông tin tài khoản để tiếp tục
              </p>
            </div>

            {/* Form */}
            {/* autoComplete="off" ở form tag giúp chặn trình duyệt cố gắng điền toàn bộ form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
              autoComplete="off"
            >
              {/* Identifier Field (nhận cả email hoặc username) */}
              <div className="space-y-2">
                <Label htmlFor="identifier">Email hoặc Username của bạn</Label>
                <Input
                  id="identifier"
                  // name khác với "email" để trình duyệt không tự điền email cũ vào đây
                  name="login_identifier"
                  type="text" // Dùng text để nhập được cả username
                  placeholder="Nhập email hoặc username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="off" // Chặn gợi ý
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="login_password_new" // Đổi name lạ đi chút để tránh trùng với form đăng ký
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="new-password" // Trick để trình duyệt nghĩ đây là mk mới, không điền mk cũ
                    className="h-11 pr-10"
                  />
                  {/* Nút toggle hiển thị mật khẩu */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  "Đăng nhập"
                )}
              </Button>
            </form>
            {/* Separator - Dòng ngăn cách giữa form đăng nhập và Google */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Hoặc tiếp tục với
                </span>
              </div>
            </div>
            {/* Google Sign-in Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 bg-secondary text-secondary-foreground
                border-2 border-transparent transition-all
                hover:bg-transparent hover:border-secondary-foreground
                dark:hover:bg-secondary/90"
              onClick={signInWithGoogle}
              disabled={isLoading}
            >
              {/* Google Icon SVG */}
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="currentColor"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="currentColor"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="currentColor"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="currentColor"
                />
              </svg>
              Đăng nhập với Google
            </Button>
            {/* Links đến các trang khác */}
            <div className="text-center text-sm text-muted-foreground space-y-2">
              <p>
                Chưa có tài khoản?{" "}
                <Link href="/register" className="text-primary hover:underline">
                  Đăng ký ngay
                </Link>
              </p>
              <p>
                <Link
                  href="/forgot-password"
                  className="text-primary hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
