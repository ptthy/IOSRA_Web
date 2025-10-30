import axios, { AxiosRequestHeaders } from "axios";
// 1. Lấy Base URL từ file .env.local
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  console.error(
    "Lỗi: NEXT_PUBLIC_API_BASE_URL chưa được thiết lập trong file .env.local"
  );
}

// 2. Tạo một instance axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 3. Cấu hình Interceptor (Tự động đính kèm token)
apiClient.interceptors.request.use(
  (config) => {
    // Đảm bảo config.headers tồn tại trước khi thêm Authorization
    if (!config.headers) {
      config.headers = {} as AxiosRequestHeaders; // Khởi tạo nếu chưa có
    }

    // Chỉ chạy ở trình duyệt (client-side)
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken");
      if (token) {
        // Bây giờ config.headers chắc chắn tồn tại
        config.headers["Authorization"] = `Bearer ${token}`;
        // Hoặc dùng dot notation: config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
