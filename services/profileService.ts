//services/profileService.ts
import apiClient from "./apiClient";

// --- Interfaces ---
interface UpdateProfileData {
  displayName?: string;
  bio?: string;
  gender?: "M" | "F" | "other" | "unspecified";
  birthday?: string;
}
interface ProfileResponse {
  author?: {
    rankName: string; // "Casual" | "Bronze" | "Silver" | "Gold" | "Diamond"
    // các field khác nếu có
  };
}
export const profileService = {
  /**
   * Lấy thông tin hồ sơ chung
   */
  getProfile: () => {
    return apiClient.get("/api/Profile");
  },

  /**
   * Lấy thông tin Ví & Subscription riêng biệt
   * Endpoint: GET /api/Profile/wallet
   */
  getWallet: () => {
    return apiClient.get("/api/Profile/wallet");
  },

  /**
   * Cập nhật thông tin hồ sơ
   */
  updateProfile: (data: UpdateProfileData) => {
    return apiClient.put("/api/Profile", data);
  },

  /**
   * Tải lên ảnh đại diện
   */
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post("/api/Profile/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  requestEmailChange: (newEmail: string) => {
    return apiClient.post("/api/Profile/email/otp", { newEmail });
  },

  verifyEmailChange: (otp: string) => {
    return apiClient.post("/api/Profile/email/verify", { otp });
  },

  getAuthorRank: async (): Promise<string> => {
    try {
      const res = await profileService.getProfile();
      // API trả về author?.rankName
      return res.data.author?.rankName || "Casual";
    } catch (error) {
      console.error("Lỗi lấy rank tác giả:", error);
      return "Casual"; // an toàn, không có quyền = Casual
    }
  },
};
