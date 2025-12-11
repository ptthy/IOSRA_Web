//services/apiClient.ts

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // THÊM DÒNG NÀY để gửi/nhận cookies
});
// --- HELPER-New: LOGIC HIỂN THỊ TOAST TỪ USER ---
const showErrorToast = (err: any) => {
  // Chỉ hiện toast ở client-side
  if (typeof window === "undefined") return;

  // Kiểm tra cấu trúc lỗi { error: { code, message, details } }
  if (err.response && err.response.data && err.response.data.error) {
    const { message, details } = err.response.data.error;

    // 1. Ưu tiên tìm trong 'details' để lấy message cụ thể
    if (details) {
      const firstKey = Object.keys(details)[0];
      if (firstKey && details[firstKey].length > 0) {
        const specificMsg = details[firstKey].join(" ");
        toast.error(specificMsg);
        return;
      }
    }

    // 2. Nếu không có details, lấy message chung của error
    if (message) {
      toast.error(message);
      return;
    }
  }

  // --- FALLBACK (Cho các lỗi mạng hoặc lỗi không đúng chuẩn trên) ---
  const fallbackMsg =
    err.response?.data?.message || "Có lỗi xảy ra. Vui lòng thử lại.";

  // Không hiện toast fallback nếu lỗi là 401 (vì sẽ xử lý refresh token)
  // hoặc các mã lỗi đặc biệt đã được xử lý riêng (như ChapterLocked log bên dưới)
  if (err.response?.status !== 401) {
    toast.error(fallbackMsg);
  }
};

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

// Hàm chung để refresh token
export const refreshToken = async (): Promise<string> => {
  const refreshResponse = await axios.post(
    `${API_BASE_URL}/api/Auth/refresh`,
    {},
    {
      withCredentials: true, //send cookie
    }
  );

  const newToken =
    refreshResponse.data?.token || refreshResponse.data?.data?.token;

  if (!newToken) {
    throw new Error("Không nhận được token mới từ refresh API");
  }

  localStorage.setItem("authToken", newToken);
  return newToken;
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
        showErrorToast(error); // <--- THÊM DÒNG NÀY
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
        showErrorToast(error); // <--- THÊM DÒNG NÀY
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
        const newToken = await refreshToken();

        // Cập nhật header cho request ban đầu
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }

        // Xử lý queue và retry request ban đầu
        processQueue(null, newToken);
        isRefreshing = false;

        return apiClient(originalRequest);
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

    // Xử lý lỗi 403 - THỬ REFRESH TOKEN TRƯỚC
    if (
      error.response?.status === 403 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      // Chỉ refresh ở client-side
      if (typeof window === "undefined") {
        return Promise.reject(error);
      }

      // Kiểm tra có token trong localStorage không
      const currentToken = localStorage.getItem("authToken");
      if (!currentToken) {
        // Không có token -> xử lý 403 như bình thường
        return handle403Error(error);
      }

      // Kiểm tra các error code đặc biệt - KHÔNG refresh cho các case này
      const responseData = error.response?.data as any;
      const errorCode = responseData?.error?.code;

      // Các error code đặc biệt không cần refresh (do không phải lỗi token)
      if (
        errorCode === "ChapterLocked" ||
        errorCode === "SubscriptionRequired" ||
        errorCode === "AccountRestricted"
      ) {
        return Promise.reject(error);
      }
      const errorMsgLower = (responseData?.error?.message || "").toLowerCase();
      const isAuthorPermissionError =
        errorMsgLower.includes("author") ||
        errorMsgLower.includes("tác giả") ||
        (typeof window !== "undefined" &&
          window.location.pathname.startsWith("/author"));

      if (isAuthorPermissionError) {
        console.log("Phát hiện lỗi thiếu quyền Author -> Thử refresh token...");
        // Code phía dưới sẽ tự động chạy logic refresh vì chúng ta không return Promise.reject()
      }
      // --------------------

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
            // Nếu retry vẫn 403, xử lý như 403 bình thường
            if (err.response?.status === 403) {
              return handle403Error(err);
            }
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Thử refresh token
        const newToken = await refreshToken();

        // Cập nhật header cho request ban đầu
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }

        // Xử lý queue
        processQueue(null, newToken);
        isRefreshing = false;

        // Retry request ban đầu
        const retryResponse = await apiClient(originalRequest);

        // Nếu retry thành công, trả về response
        return retryResponse;
      } catch (refreshError: any) {
        // Refresh thất bại hoặc retry vẫn 403 -> xử lý 403 như bình thường
        isRefreshing = false;
        processQueue(refreshError, null);

        // Nếu retry vẫn 403, xử lý như 403 bình thường
        if (refreshError.response?.status === 403) {
          return handle403Error(refreshError);
        }

        // Nếu refresh token hết hạn -> logout
        if (refreshError.response?.status === 401) {
          try {
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

          if (typeof window !== "undefined") {
            localStorage.removeItem("authToken");
            localStorage.removeItem("authUser");
            window.location.href = "/login";
          }
        }

        return Promise.reject(refreshError);
      }
    }

    // Nếu đã retry rồi mà vẫn 403, xử lý như 403 bình thường
    if (error.response?.status === 403) {
      return handle403Error(error);
    }
    // --- THÊM DÒNG NÀY ĐỂ HIỆN LỖI CHUNG ---
    showErrorToast(error);
    return Promise.reject(error);
  }
);

// Hàm xử lý 403 sau khi đã thử refresh
const handle403Error = (error: AxiosError) => {
  const responseData = error.response?.data as any;
  const errorCode = responseData?.error?.code;
  const errorMessage = responseData?.error?.message?.toLowerCase();

  // PHÂN BIỆT CÁC LOẠI 403:

  // 1. 403 ChapterLocked -> KHÔNG đá ra login, để component xử lý
  if (errorCode === "ChapterLocked") {
    console.log("🎯 Chapter bị khóa - giữ nguyên trên trang reader");
    return Promise.reject(error);
  }
  // 2. 403 SubscriptionRequired -> KHÔNG đá ra login
  else if (errorCode === "SubscriptionRequired") {
    console.log("🎯 Cần gói Premium - giữ nguyên trên trang");
    toast.error("Bạn cần gói Premium để thực hiện thao tác này."); // <--- THÊM
    return Promise.reject(error);
  }
  // 3. 403 AccountRestricted (Bị cấm đăng/tương tác) -> KHÔNG đá ra login
  else if (errorCode === "AccountRestricted") {
    console.log("🎯 Tài khoản bị hạn chế - giữ nguyên để hiện thông báo");
    showErrorToast(error); // <--- THÊM (Hiện lý do bị cấm từ backend)
    return Promise.reject(error);
  }
  // 4. 403 do không có quyền author (kiểm tra error message/code HOẶC đang ở trang author)
  else if (
    errorMessage?.includes("author") ||
    errorMessage?.includes("tác giả") ||
    errorCode?.includes("Author") ||
    (typeof window !== "undefined" &&
      window.location.pathname.startsWith("/author"))
  ) {
    if (
      typeof window !== "undefined" &&
      !window.location.pathname.includes("author-upgrade")
    ) {
      window.location.href = "/author-upgrade";
    }
    return Promise.reject(error);
  }
  // 5. 403 khác (token invalid, etc.) -> đá ra trang home
  else {
    showErrorToast(error);
    if (typeof window !== "undefined") {
      // Xóa token và thông tin người dùng khỏi localStorage
      localStorage.removeItem("authToken");
      localStorage.removeItem("authUser");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
};

export default apiClient;
