//app/register/page.tsx
"use client";

import React, { useState } from "react";
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
  // AlertTriangle,
} from "lucide-react";
import Link from "next/link";

import { authService } from "../../services/authService";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { jwtDecode } from "jwt-decode";

/**
 * TRANG ĐĂNG KÝ TÀI KHOẢN - XỬ LÝ REGISTER VÀ GOOGLE SIGN-UP
 *
 * MỤC ĐÍCH:
 * - Đăng ký tài khoản mới bằng email/password
 * - Đăng ký/đăng nhập bằng Google OAuth
 * - Validation form client-side
 * - Xử lý redirect sau khi đăng ký thành công
 *
 * FLOW CHÍNH:
 * 1. Người dùng nhập thông tin (username, email, password)
 * 2. Validation client-side (password length, confirm password)
 * 3. Gọi API register -> redirect đến verify OTP nếu thành công
 * 4. Hoặc đăng nhập bằng Google -> xử lý 2 case:
 *    a. Tài khoản đã tồn tại: login thẳng
 *    b. Tài khoản mới: redirect đến complete registration
 *
 * ĐIỂM QUAN TRỌNG:
 * - Xử lý lỗi validation từ backend chi tiết
 * - Firebase Google Auth integration
 * - JWT token decoding và lưu vào AuthContext
 */
export default function RegisterRoute() {
  const router = useRouter();
  // Lấy hàm setAuthData từ AuthContext để lưu thông tin đăng nhập khi Google Login thành công
  const { setAuthData } = useAuth();

  // State quản lý các trường nhập liệu
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // State quản lý hiển thị mật khẩu
  const [showPasswords, setShowPasswords] = useState(false);

  // State quản lý lỗi và trạng thái
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * HÀM XỬ LÝ ĐĂNG KÝ BẰNG EMAIL/PASSWORD
   *
   * FLOW CHI TIẾT:
   * 1. Validate client-side:
   *    - Password >= 6 ký tự
   *    - Password và confirm password khớp
   * 2. Gọi API register với thông tin user
   * 3. Nếu thành công:
   *    - Redirect đến verify-otp với email trong query params
   * 4. Nếu thất bại:
   *    - Xử lý lỗi từ backend (ưu tiên details -> message -> fallback)
   *
   * SECURITY NOTE:
   * - Password validation chỉ ở client, server sẽ validate lại
   * - Email sẽ được encode trong URL để tránh XSS
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // Reset lỗi trước khi validate

    // 1. VALIDATION CLIENT-SIDE
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    // Validation xác nhận mật khẩu
    if (password !== confirmPassword) {
      setError("Mật khẩu và mật khẩu xác nhận không khớp");
      return;
    }
    setIsLoading(true); // Bắt đầu loading
    try {
      // 2. GỌI API ĐĂNG KÝ
      await authService.register({
        username,
        email,
        password,
        confirmPassword,
      });
      // 3. THÀNH CÔNG: Redirect đến verify OTP
      toast.success("Đăng ký thành công! Vui lòng kiểm tra email để xác thực.");

      // Encode email để đảm bảo an toàn trong URL
      router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setIsLoading(false);

      // --- XỬ LÝ LỖI CHI TIẾT TỪ BACKEND ---
      // Kiểm tra cấu trúc lỗi { error: { code, message, details } }
      if (err.response && err.response.data && err.response.data.error) {
        const { message, details } = err.response.data.error;

        // 1. Ưu tiên tìm trong 'details' để lấy message cụ thể (VD: "Email/Username không được có space")
        if (details) {
          const firstKey = Object.keys(details)[0]; // Lấy key đầu tiên (VD: Identifier)
          if (firstKey && details[firstKey].length > 0) {
            const specificMsg = details[firstKey].join(" ");
            setError(specificMsg);
            toast.error(specificMsg);
            return;
          }
        }

        // 2. Nếu không có details, lấy message chung của error
        if (message) {
          setError(message);
          toast.error(message);
          return;
        }
      }

      // --- FALLBACK (Cho các lỗi mạng hoặc lỗi không đúng chuẩn trên) ---
      const fallbackMsg =
        err.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.";
      setError(fallbackMsg);
      toast.error(fallbackMsg);
    }
  };

  /**
   * HÀM XỬ LÝ ĐĂNG NHẬP/ĐĂNG KÝ BẰNG GOOGLE
   *
   * FLOW PHỨC TẠP - XỬ LÝ 2 TRƯỜNG HỢP:
   * 1. USER ĐÃ TỒN TẠI TRONG DB:
   *    - Firebase auth thành công
   *    - Gửi idToken đến backend
   *    - Backend trả về JWT của user -> login thẳng
   *
   * 2. USER MỚI (CHƯA ĐĂNG KÝ):
   *    - Firebase auth thành công
   *    - Backend trả 409/404 (user not found)
   *    - Redirect đến /google-complete để hoàn tất đăng ký
   *
   * FIREBASE AUTH FLOW:
   * 1. signInWithPopup: Mở popup Google login
   * 2. getUser().getIdToken(): Lấy Firebase idToken
   * 3. Gửi idToken đến backend để verify
   */
  const signInWithGoogle = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      // 1. Mở pop-up và đăng nhập Firebase
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // 2. LẤY idToken TỪ FIREBASE (JWT của Firebase)
      const idToken = await user.getIdToken();

      // 3. GỬI idToken ĐẾN BACKEND ĐỂ VERIFY/CREATE ACCOUNT
      const response = await authService.loginWithGoogle({ idToken });

      // 4. Xử lý response từ backend
      const {
        username: backendUsername,
        email: backendEmail,
        token: backendToken,
        roles,
      } = response.data;

      // TRƯỜNG HỢP 1: USER ĐÃ TỒN TẠI VÀ ĐĂNG NHẬP THÀNH CÔNG
      if (backendToken && backendUsername && backendEmail) {
        // Backend trả về 200 OK -> User ĐÃ TỒN TẠI VÀ ĐĂNG NHẬP THÀNH CÔNG
        const decodedPayload: any = jwtDecode(backendToken);
        const userToSet = {
          id: decodedPayload.sub, // Lấy ID từ token (chuẩn JWT là 'sub')
          username: backendUsername,
          email: backendEmail,
          role: roles && roles.length > 0 ? roles[0] : "reader",
          isPremium: false,
        };

        // Lưu thông tin đăng nhập vào context và localStorage
        setAuthData(userToSet, backendToken);
        // AuthContext sẽ tự động chuyển hướng sau khi setAuthData
      } else {
        // Trường hợp Backend trả về 200 OK nhưng thiếu token/username/email
        toast.error("Đăng nhập Google thất bại: Dữ liệu trả về không đầy đủ.");
        setIsLoading(false);
      }
    } catch (err: any) {
      // 5. Xử lý lỗi

      // A. Xử lý lỗi 409 (hoặc 404 tùy logic backend) - User mới cần hoàn tất đăng ký
      // (Giả sử BE trả 409 cho tài khoản chưa đăng ký)
      if (err.response?.status === 409 || err.response?.status === 404) {
        try {
          const currentUser = auth.currentUser;
          if (currentUser) {
            const idToken = await currentUser.getIdToken();
            const googleEmail = currentUser.email;

            if (idToken && googleEmail) {
              toast.info("Tài khoản Google mới, vui lòng hoàn tất đăng ký.");
              router.push(
                `/google-complete?idToken=${idToken}&email=${googleEmail}`
              );
            } else {
              toast.error("Không lấy được thông tin Google sau khi đăng nhập.");
              setIsLoading(false);
            }
          } else {
            toast.error(
              "Không tìm thấy thông tin người dùng Google sau khi đăng nhập."
            );
            setIsLoading(false);
          }
        } catch (innerError) {
          toast.error("Lỗi khi lấy thông tin để hoàn tất đăng ký.");
          console.error("Inner Error fetching token/email:", innerError);
          setIsLoading(false);
        }
      }
      // B. Xử lý lỗi Firebase: Người dùng đóng pop-up
      else if (err.code === "auth/popup-closed-by-user") {
        toast.info("Bạn đã đóng cửa sổ đăng nhập Google.");
        setIsLoading(false);
      }
      // C. Xử lý lỗi Firebase: Email đã được đăng ký bằng phương thức khác
      else if (err.code === "auth/account-exists-with-different-credential") {
        const credential = "mật khẩu/email"; // Thông báo chung
        toast.error(
          `Email này đã được đăng ký bằng ${credential} khác. Vui lòng sử dụng phương thức đăng nhập đó.`
        );
        setIsLoading(false);
      }
      // D. Xử lý lỗi Backend/Firebase chung
      else {
        const errMsg =
          err.response?.data?.message ||
          err.message ||
          "Đăng nhập Google thất bại.";
        toast.error(errMsg);
        setIsLoading(false);
      }
    }
  };
  /**
   * ẢNH FALLBACK KHI ẢNH CHÍNH BỊ LỖI
   *
   * KỸ THUẬT: Sử dụng base64 encoded SVG để không phụ thuộc external URL
   * ƯU ĐIỂM: Luôn available, không cần network request
   */
  const ERROR_IMG_SRC =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==";

  // --- Toàn bộ JSX từ RegisterPage được chuyển vào đây ---
  /**
   * RENDER CHÍNH CỦA TRANG ĐĂNG KÝ
   *
   * LAYOUT 2 CỘT:
   * - Left (Desktop only): Visual với hình ảnh và mô tả
   * - Right: Form đăng ký
   *
   * RESPONSIVE:
   * - Mobile: Chỉ hiển thị form, logo trên cùng
   * - Desktop: Split 50/50
   */
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Visual (Chỉ hiện trên desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0">
          {imageError ? (
            // Fallback khi ảnh lỗi
            <div className="w-full h-full flex items-center justify-center bg-gray-100 opacity-20">
              <img
                src={ERROR_IMG_SRC}
                alt="Error loading image"
                className="w-20 h-20"
              />
            </div>
          ) : (
            <img
              // Ảnh background chính
              src="https://images.unsplash.com/photo-1615714901965-277d5a9f11d1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlYm9vayUyMHJlYWRpbmclMjBhdWRpb2Jvb2t8ZW58MXx8fHwxNzYxMTI5Mjg4fDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Reading experience"
              className="w-full h-full object-cover opacity-20"
              onError={() => setImageError(true)} // Xử lý lỗi load ảnh
            />
          )}
        </div>
        {/* Overlay content trên ảnh */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-primary-foreground">
          <div className="max-w-md text-center space-y-6">
            {/* Logo Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-foreground/20 backdrop-blur-sm mb-4">
              <BookOpen className="h-10 w-10" />
            </div>
            <h1 className="text-5xl">Tora Novel</h1>
            <h2 className="text-2xl">Chào mừng đến với</h2>
            <p className="text-xl">
              Nền tảng đọc truyện tương tác với AI Voice
            </p>
            {/* Brand và mô tả */}
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

      {/* Right Side - Form (Hiển thị trên cả mobile và desktop) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo (Chỉ hiện trên mobile) */}
          <div className="lg:hidden text-center">
            <h1 className="text-3xl text-primary mb-2">Tora Novel</h1>
            <p className="text-muted-foreground">
              Nền tảng đọc truyện với AI Voice
            </p>
          </div>

          <div className="space-y-6">
            {/* Form Header */}
            <div className="space-y-2 text-center lg:text-left">
              <h2 className="text-3xl">Đăng ký</h2>
              <p className="text-muted-foreground">
                Tạo tài khoản để bắt đầu hành trình đọc truyện
              </p>
            </div>
            {/* Form chính */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Field */}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Tên người dùng"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11"
                />
              </div>
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11"
                />
              </div>
              {/* Password Field với toggle visibility */}
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPasswords ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-11 pr-10"
                  />
                  {/* Toggle Password Visibility Button */}
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPasswords ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    disabled={isLoading}
                  >
                    {showPasswords ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Mật khẩu phải có ít nhất 6 ký tự
                </p>
              </div>
              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Xác nhận mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showPasswords ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPasswords ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    disabled={isLoading}
                  >
                    {showPasswords ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              {/* Error Message Display */}
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md flex items-center gap-2">
                  {/* <AlertTriangle className="h-4 w-4" /> */}
                  <span>{error}</span>
                </div>
              )}
              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  "Đăng ký"
                )}
              </Button>
            </form>
            {/* Separator "Hoặc tiếp tục với" */}
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
              Đăng ký với Google
            </Button>
            {/* Link đến trang Login */}
            <p className="text-center text-sm text-muted-foreground">
              Đã có tài khoản?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
