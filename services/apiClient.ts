//services/apiClient.ts

// ============================================
// API CLIENT - HTTP CLIENT CHO TOÀN BỘ ỨNG DỤNG
// MỤC ĐÍCH: Quản lý tất cả API request/response, xử lý token, lỗi tự động
// CHỨC NĂNG CHÍNH:
// 1. Tạo axios instance với baseURL, timeout
// 2. Interceptor request: thêm token vào header
// 3. Interceptor response: xử lý lỗi 401/403, refresh token tự động
// 4. Hiển thị thông báo lỗi thân thiện
// 5. Queue request khi đang refresh token
// LIÊN THÔNG VỚI:
// - AuthContext (lấy token từ localStorage)
// - Backend API (gọi endpoints)
// - Các service khác (import và sử dụng instance này)
// ============================================

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner"; // Thư viện dùng để hiển thị thông báo (popup) cho người dùng

// Lấy địa chỉ Server Backend từ file cấu hình môi trường
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Tạo instance axios để dùng chung cho cả app
// Mỗi lần gọi API sẽ dùng instance này thay vì axios trực tiếp
// ƯU ĐIỂM: Cấu hình một lần, dùng nhiều nơi, dễ maintain
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Nếu yêu cầu quá 30 giây mà không phản hồi sẽ tự hủy
  headers: {
    "Content-Type": "application/json", // Mặc định gửi JSON
  },
  withCredentials: true, // QUAN TRỌNG: Cho phép gửi và nhận Cookies (dùng cho Session/Auth)
});

// --- HELPER: HIỂN THỊ THÔNG BÁO LỖI TỪ SERVER ---
/**
 * Hiển thị thông báo lỗi từ response server
 * LOGIC XỬ LÝ:
 * 1. Ưu tiên lấy message từ details (validation errors)
 * 2. Fallback lấy message chung từ error
 * 3. Không hiện toast cho lỗi 401 (đã xử lý refresh token)
 * CẤU TRÚC LỖI CHUẨN TỪ BACKEND: { error: { code, message, details } }
 */
const showErrorToast = (err: any) => {
  // Chỉ hiện toast ở client-side
  if (typeof window === "undefined") return;

  // Kiểm tra cấu trúc lỗi chuẩn từ backend:{ error: { code, message, details } }
  if (err.response && err.response.data && err.response.data.error) {
    const { message, details } = err.response.data.error;

    // 1. Ưu tiên tìm trong 'details' để lấy message cụ thể
    if (details) {
      const firstKey = Object.keys(details)[0]; // Lấy key đầu tiên (ví dụ: "email")
      if (firstKey && details[firstKey].length > 0) {
        const specificMsg = details[firstKey].join(" "); // Nối mảng thành string
        toast.error(specificMsg); // Hiện popup lỗi
        return; // Thoát sớm, không chạy code phía dưới
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

// --- BIẾN TOÀN CỤC CHO CƠ CHẾ REFRESH TOKEN ---
/**
 * CƠ CHẾ QUEUE REQUEST KHI REFRESH TOKEN:
 * 1. Khi phát hiện token hết hạn (401), bắt đầu refresh token
 * 2. Các request đến sau được cho vào hàng đợi (failedQueue)
 * 3. Khi refresh xong, xử lý hàng đợi với token mới
 * 4. Nếu refresh thất bại, reject tất cả request trong hàng đợi
 */
let isRefreshing = false; // Flag tránh refresh nhiều lần cùng lúc
let failedQueue: Array<{
  // Hàng đợi các request bị fail
  resolve: (value?: any) => void; // Hàm resolve khi retry thành công
  reject: (error?: any) => void; // Hàm reject khi retry thất bại
}> = [];
// Hàm xử lý hàng đợi: gọi resolve/reject cho tất cả request đang đợi
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error); // Nếu có lỗi, reject tất cả
    } else {
      prom.resolve(token); // Nếu thành công, resolve với token mới
    }
  });
  failedQueue = []; // Xóa hàng đợi sau khi xử lý
};

// --- HÀM REFRESH TOKEN CHÍNH ---
/**
 * Gọi API refresh token để lấy token mới
 * CƠ CHẾ:
 * 1. Server kiểm tra refresh token trong cookie
 * 2. Nếu valid, trả về access token mới
 * 3. Lưu token mới vào localStorage
 * LƯU Ý: Refresh token được lưu trong httpOnly cookie, không truy cập được từ JS
 */
export const refreshToken = async (): Promise<string> => {
  // Gọi API refresh token (server sẽ kiểm tra refresh token trong cookie)
  const refreshResponse = await axios.post(
    `${API_BASE_URL}/api/Auth/refresh`, // Endpoint refresh
    {}, // Không cần body, chỉ cần cookie
    {
      withCredentials: true, // Gửi cookie chứa refresh token
    }
  );

  // Lấy token mới từ response (có thể ở data.token hoặc data.data.token)
  const newToken =
    refreshResponse.data?.token || refreshResponse.data?.data?.token;

  if (!newToken) {
    throw new Error("Không nhận được token mới từ refresh API");
  }
  // Lưu token mới vào localStorage để dùng cho các request tiếp theo
  localStorage.setItem("authToken", newToken);
  return newToken; // Trả về token mới
};

// ============================================
// INTERCEPTOR CHO REQUEST (chạy TRƯỚC khi gửi API)
// MỤC ĐÍCH: Thêm token vào header, xử lý FormData
// ============================================
apiClient.interceptors.request.use(
  (config) => {
    // Chỉ chạy ở client-side
    if (typeof window !== "undefined") {
      // Lấy token từ localStorage (đã lưu khi login)
      const token = localStorage.getItem("authToken");

      if (token) {
        // Thêm token vào header Authorization theo chuẩn Bearer
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Đối với FormData, không set Content-Type (axios sẽ tự set)
    // Xử lý đặc biệt cho FormData (upload file, ảnh)
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"]; // Axios tự động set Content-Type cho FormData
    } else {
      config.headers["Content-Type"] = "application/json"; // Mặc định là JSON
    }

    return config; // Trả về config đã chỉnh sửa
  },
  (error) => {
    return Promise.reject(error); // Nếu lỗi ở request, reject ngay
  }
);

// ============================================
// INTERCEPTOR CHO RESPONSE (chạy SAU khi nhận response)
// MỤC ĐÍCH: Xử lý lỗi 401/403, refresh token tự động
// PHẦN QUAN TRỌNG NHẤT: Logic tự động refresh token
// ============================================
apiClient.interceptors.response.use(
  (response) => {
    return response; // Nếu thành công thì cứ để dữ liệu đi tiếp
  },
  // Lấy mã lỗi từ Server (401, 403, 500...)
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean; // Thêm flag để đánh dấu đã retry chưa
    };

    // ========== XỬ LÝ LỖI 401 (UNAUTHORIZED) ==========
    // Lỗi 401 thường là token hết hạn hoặc không hợp lệ
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
        showErrorToast(error);
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
          failedQueue.push({ resolve, reject }); // Thêm vào hàng đợi
        })
          .then((token) => {
            // Khi có token mới, cập nhật header và retry request
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest); // Gửi lại request ban đầu
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }
      // Đánh dấu request này đang được retry
      originalRequest._retry = true;
      isRefreshing = true; // Bật flag đang refresh

      try {
        // Thực hiện refresh token
        const newToken = await refreshToken();

        // Cập nhật header cho request ban đầu với token mới
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }

        /// Xử lý hàng đợi: gửi token mới cho tất cả request đang đợi
        processQueue(null, newToken);
        isRefreshing = false;

        return apiClient(originalRequest);
      } catch (refreshError: any) {
        // Refresh token cũng hết hạn hoặc lỗi -> gọi logout
        isRefreshing = false;
        processQueue(refreshError, null); // Thông báo lỗi cho hàng đợi

        try {
          // Gọi API logout để server xóa session
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

    // ========== XỬ LÝ LỖI 403 (FORBIDDEN) ==========
    // Lỗi 403: Có token nhưng không có quyền truy cập
    // KHÁC BIỆT VỚI 401: Có thể do thiếu role, chapter locked,...
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
      // ChapterLocked: Chương bị khóa (cần mua)
      // SubscriptionRequired: Cần gói premium
      // AccountRestricted: Tài khoản bị cấm
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

      // Tránh refresh nhiều lần đồng thời (logic tương tự 401)
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

        // Xử lý hàng đợi
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
    // showErrorToast(error); xóa để ko bị duplicate
    return Promise.reject(error);
  }
);

// ============================================
// HÀM XỬ LÝ 403 SAU KHI ĐÃ THỬ REFRESH
// MỤC ĐÍCH: Phân loại và xử lý các loại 403 khác nhau
// QUAN TRỌNG: Không phải 403 nào cũng đá ra login
// ============================================
const handle403Error = (error: AxiosError) => {
  const responseData = error.response?.data as any;
  const errorCode = responseData?.error?.code;
  const errorMessage = responseData?.error?.message?.toLowerCase();

  // PHÂN BIỆT CÁC LOẠI 403:

  // 1. 403 ChapterLocked -> KHÔNG đá ra login, để component xử lý
  // TÌNH HUỐNG: User cố đọc chương premium mà chưa mua
  if (errorCode === "ChapterLocked") {
    console.log("🎯 Chapter bị khóa - giữ nguyên trên trang reader");
    return Promise.reject(error); // Reject để component hiển thị UI mua chương
  }
  // 2. 403 SubscriptionRequired -> KHÔNG đá ra login
  // TÌNH HUỐNG: User cần mua gói premium để thực hiện hành động
  else if (errorCode === "SubscriptionRequired") {
    console.log("🎯 Cần gói Premium - giữ nguyên trên trang");
    toast.error("Bạn cần gói Premium để thực hiện thao tác này."); // <--- THÊM
    return Promise.reject(error);
  }
  // 3. 403 AccountRestricted (Bị cấm đăng/tương tác) -> KHÔNG đá ra login
  // TÌNH HUỐNG: User bị admin cấm comment/đăng truyện
  else if (errorCode === "AccountRestricted") {
    console.log("🎯 Tài khoản bị hạn chế - giữ nguyên để hiện thông báo");
    showErrorToast(error); // <--- THÊM (Hiện lý do bị cấm từ backend)
    return Promise.reject(error);
  }
  // 4. 403 do không có quyền author (kiểm tra error message/code HOẶC đang ở trang author)
  // TÌNH HUỐNG: Reader cố truy cập trang author mà chưa được approve
  else if (
    errorMessage?.includes("author") ||
    errorMessage?.includes("tác giả") ||
    errorCode?.includes("Author") ||
    (typeof window !== "undefined" &&
      window.location.pathname.startsWith("/author"))
  ) {
    // KHÔNG redirect nếu đang ở trang staff (Op, Admin, Content)
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      const isStaffPage =
        currentPath.startsWith("/Op/") ||
        currentPath.startsWith("/Admin") ||
        currentPath.startsWith("/Content/");

      // Chỉ redirect đến author-upgrade nếu:
      // 1. KHÔNG phải trang staff
      // 2. VÀ chưa ở trang author-upgrade
      if (!isStaffPage && !currentPath.includes("author-upgrade")) {
        window.location.href = "/author-upgrade"; // Redirect đến trang nâng cấp tác giả
      } else if (isStaffPage) {
        // Nếu là trang staff, chỉ hiện lỗi, không redirect
        showErrorToast(error);
      }
    }
    return Promise.reject(error);
  }
  // 5. 403 khác (token invalid, etc.) -> đá ra trang home
  // TÌNH HUỐNG: Token không hợp lệ, hoặc không có quyền truy cập chung
  else {
    showErrorToast(error);
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      const isStaffPage =
        currentPath.startsWith("/Op/") ||
        currentPath.startsWith("/Admin") ||
        currentPath.startsWith("/Content/");

      // KHÔNG xóa token nếu đang ở trang staff (có thể chỉ là lỗi quyền API)
      if (!isStaffPage) {
        // Xóa token và thông tin người dùng khỏi localStorage
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
        window.location.href = "/";
      }
      // Nếu là trang staff, chỉ hiện lỗi, giữ nguyên trang
    }
    return Promise.reject(error);
  }
};

export default apiClient; // Xuất instance để import ở các service khác
