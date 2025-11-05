import apiClient from "./apiClient";

// --- 1. Định nghĩa kiểu dữ liệu (Interfaces) ---

// Kiểu dữ liệu cho PUT /api/Profile
// Dựa trên form của bạn, nó bao gồm cả 'displayName'
interface UpdateProfileData {
  displayName?: string;
  bio?: string;
  gender?: "M" | "F" | "other" | "unspecified";
  birthday?: string;
}

// --- 2. Tạo đối tượng Service ---

export const profileService = {
  /**
   * GET /api/Profile
   * Lấy thông tin hồ sơ chi tiết của người dùng hiện tại
   */
  getProfile: () => {
    return apiClient.get("/api/Profile");
  },

  /**
   * PUT /api/Profile
   * Cập nhật thông tin hồ sơ
   */
  updateProfile: (data: UpdateProfileData) => {
    return apiClient.put("/api/Profile", data);
  },

  /**
   * POST /api/Profile/avatar
   * Tải lên ảnh đại diện mới
   */
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    // Tên key 'file' phải khớp với backend của bạn
    // Dựa trên spec "File * required", 'file' là một key an toàn
    formData.append("file", file);

    return apiClient.post("/api/Profile/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  /**
   * POST /api/Profile/email/otp
   * Yêu cầu gửi OTP để đổi email
   */
  requestEmailChange: (newEmail: string) => {
    return apiClient.post("/api/Profile/email/otp", { newEmail });
  },

  /**
   * POST /api/Profile/email/verify
   * Xác thực OTP để hoàn tất đổi email
   */
  verifyEmailChange: (otp: string) => {
    return apiClient.post("/api/Profile/email/verify", { otp });
  },
};
