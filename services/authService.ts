// services/authService.ts
import apiClient from "./apiClient";

// --- Định nghĩa các kiểu dữ liệu cho Request Bodies ---
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

// --- Service chứa các hàm API ---
export const authService = {
  register: (data: RegisterData) => {
    return apiClient.post("/api/Auth/register", data);
  },

  login: (data: LoginData) => {
    return apiClient.post("/api/Auth/login", data);
  },

  verifyOtp: (data: VerifyOtpData) => {
    return apiClient.post("/api/Auth/verify", data);
  },

  forgotPassword: (data: ForgotPasswordData) => {
    return apiClient.post("/api/Auth/forgot-pass", data);
  },

  resetPassword: (data: ResetPasswordData) => {
    return apiClient.post("/api/Auth/forgot-pass/verify", data);
  },

  loginWithGoogle: (data: GoogleLoginData) => {
    return apiClient.post("/api/Auth/google", data);
  },

  completeGoogleLogin: (data: GoogleCompleteData) => {
    return apiClient.post("/api/Auth/google/complete", data);
  },

  logout: () => {
    return apiClient.post("/api/Auth/logout");
  },
};
