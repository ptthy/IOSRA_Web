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
      const errorMessage = error.response?.data?.message?.toLowerCase();

      // Phân biệt các loại 403
      if (
        errorMessage?.includes("author") ||
        errorMessage?.includes("tác giả")
      ) {
        // Lỗi do không có quyền author
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.includes("author-upgrade")
        ) {
          window.location.href = "/author-upgrade";
        }
      } else {
        // Lỗi 403 khác (token invalid, etc.)
        if (typeof window !== "undefined") {
          localStorage.removeItem("authToken");
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
