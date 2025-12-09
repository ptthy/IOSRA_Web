//services/apiClient.ts

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Flag để tránh infinite loop khi refresh token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

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
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Xử lý lỗi 401 - CHỈ khi accessToken hết hạn
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      // Chỉ refresh ở client-side
      if (typeof window === "undefined") {
        return Promise.reject(error);
      }

      // Kiểm tra có token trong localStorage không (đã đăng nhập)
      const currentToken = localStorage.getItem("authToken");
      if (!currentToken) {
        // Không có token -> không phải lỗi hết hạn, reject ngay
        return Promise.reject(error);
      }

      // Kiểm tra request có Authorization header không (đã gửi token)
      const hasAuthHeader = originalRequest.headers?.Authorization;

      // Kiểm tra error message/code từ backend để xác định loại lỗi
      const responseData = error.response?.data as any;
      const errorCode = responseData?.error?.code;
      const errorMessage =
        responseData?.error?.message?.toLowerCase() ||
        responseData?.message?.toLowerCase() ||
        "";

      // Nếu có error code/message rõ ràng là lỗi KHÔNG phải expired -> reject ngay
      const isNotExpiredError =
        errorCode?.toLowerCase().includes("invalid") ||
        errorCode?.toLowerCase().includes("unauthorized") ||
        errorMessage.includes("invalid token") ||
        errorMessage.includes("token không hợp lệ") ||
        errorMessage.includes("unauthorized");

      if (isNotExpiredError) {
        return Promise.reject(error);
      }

      // Chỉ refresh nếu:
      // 1. Có token trong localStorage VÀ có Authorization header (đã gửi token) -> coi là token hết hạn
      // 2. HOẶC error message/code rõ ràng là expired
      const isTokenExpired =
        (hasAuthHeader && currentToken) ||
        errorCode?.toLowerCase().includes("expired") ||
        errorCode?.toLowerCase().includes("tokenexpired") ||
        errorMessage.includes("expired") ||
        errorMessage.includes("hết hạn") ||
        errorMessage.includes("token expired");

      // Nếu không phải lỗi token hết hạn, reject ngay
      if (!isTokenExpired) {
        return Promise.reject(error);
      }

      // Tránh refresh nhiều lần đồng thời
      if (isRefreshing) {
        // Nếu đang refresh, đợi và retry request sau khi refresh xong
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Gọi API refresh token
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/api/Auth/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          }
        );

        const newToken =
          refreshResponse.data?.token || refreshResponse.data?.data?.token;

        if (newToken) {
          // Lưu token mới
          localStorage.setItem("authToken", newToken);

          // Cập nhật header cho request ban đầu
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }

          // Xử lý queue và retry request ban đầu
          processQueue(null, newToken);
          isRefreshing = false;

          return apiClient(originalRequest);
        } else {
          throw new Error("Không nhận được token mới từ refresh API");
        }
      } catch (refreshError: any) {
        // Refresh token cũng hết hạn hoặc lỗi -> gọi logout
        isRefreshing = false;
        processQueue(refreshError, null);

        try {
          // Gọi API logout
          await axios.post(
            `${API_BASE_URL}/api/Auth/logout`,
            {},
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("authToken")}`,
              },
            }
          );
        } catch (logoutError) {
          console.error("Lỗi khi gọi logout:", logoutError);
        }

        // Xóa token và user, đá ra login
        if (typeof window !== "undefined") {
          localStorage.removeItem("authToken");
          localStorage.removeItem("authUser");
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      }
    }

    // Xử lý lỗi 403
    if (error.response?.status === 403) {
      const responseData = error.response?.data as any;
      const errorCode = responseData?.error?.code;
      const errorMessage = responseData?.error?.message?.toLowerCase();

      //  PHÂN BIỆT CÁC LOẠI 403:

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
      // 3.  403 AccountRestricted (Bị cấm đăng/tương tác) -> KHÔNG đá ra login
      else if (errorCode === "AccountRestricted") {
        console.log("🎯 Tài khoản bị hạn chế - giữ nguyên để hiện thông báo");
        return Promise.reject(error); // Trả lỗi về để component hiện thông báo thời gian bị ban
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
      // 3. 403 khác (token invalid, etc.) -> đá ra trang home
      else {
        if (typeof window !== "undefined") {
          // Xóa token và thông tin người dùng khỏi localStorage
          localStorage.removeItem("authToken");
          localStorage.removeItem("authUser");
          window.location.href = "/";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
