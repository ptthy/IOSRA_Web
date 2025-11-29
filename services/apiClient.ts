//services/apiClient.ts
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Chỉ chạy ở client-side
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Đối với FormData, không set Content-Type (axios sẽ tự set)
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    } else {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 403) {
      const errorCode = error.response?.data?.error?.code;
      const errorMessage = error.response?.data?.error?.message?.toLowerCase();

      // 🔥 PHÂN BIỆT CÁC LOẠI 403:

      // 1. 403 ChapterLocked -> KHÔNG đá ra login, để component xử lý
      if (errorCode === "ChapterLocked") {
        console.log("🎯 Chapter bị khóa - giữ nguyên trên trang reader");
        return Promise.reject(error); // Giữ nguyên lỗi để component xử lý
      }
      //  2. 403 SubscriptionRequired -> KHÔNG đá ra login
      else if (errorCode === "SubscriptionRequired") {
        console.log("🎯 Cần gói Premium - giữ nguyên trên trang");
        return Promise.reject(error);
      }
      // 2. 403 do không có quyền author
      else if (
        errorMessage?.includes("author") ||
        errorMessage?.includes("tác giả") ||
        errorCode?.includes("Author")
      ) {
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.includes("author-upgrade")
        ) {
          window.location.href = "/author-upgrade";
        }
      }
      // 3. 403 khác (token invalid, etc.) -> đá ra login
      else {
        if (typeof window !== "undefined") {
          localStorage.removeItem("authToken");
          localStorage.removeItem("authUser");
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
