// services/authService.ts
import apiClient from "./apiClient";

// --- 1. Định nghĩa các kiểu dữ liệu (Interfaces) ---
interface RegisterData {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}
interface LoginData {
  identifier?: string;
  password?: string;
}
interface VerifyOtpData {
  email: string;
  otp: string;
}
interface ForgotPasswordData {
  email: string;
}
interface ResetPasswordData {
  email?: string;
  otp?: string;
  newPassword?: string;
  confirmNewPassword?: string;
}
interface GoogleLoginData {
  idToken: string;
}
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

// --- 2. Tạo đối tượng Service (Đã sửa lỗi đường dẫn) ---

export const authService = {
  /**
   * API Đăng ký tài khoản mới
   */
  register: (data: RegisterData) => {
    // ✅ SỬA: Xóa /api ở đầu
    return apiClient.post("/Auth/register", data);
  },

  /**
   * API Đăng nhập bằng email/username và mật khẩu
   */
  login: (data: LoginData) => {
    // ✅ SỬA: Xóa /api ở đầu
    return apiClient.post("/Auth/login", data);
  },

  /**
   * API Xác thực OTP sau khi đăng ký
   */
  verifyOtp: (data: VerifyOtpData) => {
    // ✅ SỬA: Xóa /api ở đầu
    return apiClient.post("/Auth/verify", data);
  },

  /**
   * API Yêu cầu gửi mã OTP để quên mật khẩu
   */
  forgotPassword: (data: ForgotPasswordData) => {
    // ✅ SỬA: Xóa /api ở đầu
    return apiClient.post("/Auth/forgot-pass", data);
  },

  /**
   * API Xác thực OTP và đặt mật khẩu mới
   */
  resetPassword: (data: ResetPasswordData) => {
    // ✅ SỬA: Xóa /api ở đầu
    return apiClient.post("/Auth/forgot-pass/verify", data);
  },

  /**
   * API Đăng nhập bằng Google (bước 1)
   */
  loginWithGoogle: (data: GoogleLoginData) => {
    // ✅ SỬA: Xóa /api ở đầu
    return apiClient.post("/Auth/google", data);
  },

  /**
   * API Hoàn tất đăng ký/đăng nhập Google (bước 2, nếu cần)
   */
  completeGoogleLogin: (data: GoogleCompleteData) => {
    // ✅ SỬA: Xóa /api ở đầu
    return apiClient.post("/Auth/google/complete", data);
  },

  /**
   * API Đăng xuất (vô hiệu hóa token phía server)
   */
  logout: () => {
    // ✅ SỬA: Xóa /api ở đầu
    return apiClient.post("/Auth/logout");
  },
};