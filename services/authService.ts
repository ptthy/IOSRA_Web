// services/authService.ts

// ============================================
// SERVICE QUẢN LÝ TẤT CẢ API LIÊN QUAN ĐẾN AUTHENTICATION
// Đây là lớp trung gian giữa React components và HTTP client (apiClient)
// ============================================

import apiClient from "./apiClient"; // Import HTTP client đã config

// --- 1. Định nghĩa các kiểu dữ liệu (Interfaces) cho Request Bodies ---

// POST /Auth/register
interface RegisterData {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

// POST /Auth/login
interface LoginData {
  identifier?: string;
  password?: string;
}

// POST /Auth/verify
interface VerifyOtpData {
  email: string;
  otp: string;
}

// POST /Auth/forgot-pass
interface ForgotPasswordData {
  email: string;
}

// POST /Auth/forgot-pass/verify
interface ResetPasswordData {
  email?: string;
  otp?: string;
  newPassword?: string;
  confirmNewPassword?: string;
}

// POST /Auth/google Đăng nhập Google (bước 1)
interface GoogleLoginData {
  idToken: string; // Token từ Google OAuth
}

// POST /Auth/google/complete - Hoàn tất đăng nhập Google
interface GoogleCompleteData {
  idToken: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: "reader" | "author"; // Thêm role
  // ... các trường khác
}

// -----------------------------------------------------------------

// --- 2. Tạo đối tượng Service chứa 8 hàm API ---

export const authService = {
  /**
   * API Đăng ký tài khoản mới
   * @param data: RegisterData
   * @returns Promise với response từ server
   */
  register: (data: RegisterData) => {
    return apiClient.post("/api/Auth/register", data);
  },

  /**
   * API Đăng nhập bằng email/username và mật khẩu
   * Trả về { user, token }
   */
  login: (data: LoginData) => {
    return apiClient.post("/api/Auth/login", data);
  },

  /**
   * API Xác thực OTP sau khi đăng ký
   */
  verifyOtp: (data: VerifyOtpData) => {
    return apiClient.post("/api/Auth/verify", data);
  },

  /**
   * API Yêu cầu gửi mã OTP để quên mật khẩu
   */
  forgotPassword: (data: ForgotPasswordData) => {
    return apiClient.post("/api/Auth/forgot-pass", data);
  },

  /**
   * API Xác thực OTP và đặt mật khẩu mới
   */
  resetPassword: (data: ResetPasswordData) => {
    return apiClient.post("/api/Auth/forgot-pass/verify", data);
  },

  /**
   * API Đăng nhập bằng Google (bước 1)
   */
  loginWithGoogle: (data: GoogleLoginData) => {
    return apiClient.post("/api/Auth/google", data);
  },

  /**
   * API Hoàn tất đăng ký/đăng nhập Google (bước 2, nếu cần)
   */
  completeGoogleLogin: (data: GoogleCompleteData) => {
    return apiClient.post("/api/Auth/google/complete", data);
  },

  /**
   * API Đăng xuất (vô hiệu hóa token phía server)
   */
  logout: () => {
    // Không cần body, nhưng vẫn là POST request
    return apiClient.post("/api/Auth/logout"); // Server sẽ xóa session và refresh token
  },
  /**
   * API Lấy thông tin profile của user hiện tại
   * Dùng token trong header để xác thực
   */
  getMyProfile: () => {
    return apiClient.get("/api/Profile");
  },

  /**
   * API Refresh token (tạo token mới từ refresh token)
   * Thường được gọi tự động bởi apiClient interceptor
   */
  refreshToken: () => {
    return apiClient.post("/api/Auth/refresh");
  },
};
