"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authService } from "@/services/authService";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { jwtDecode } from "jwt-decode";
// 1. Định nghĩa kiểu dữ liệu User
// (Tùy chỉnh cho khớp với dữ liệu User backend trả về)
interface User {
  id: string;
  username: string;
  email: string;
  role?: string;
}

// 2. Định nghĩa kiểu dữ liệu cho Context
interface AuthContextType {
  user: User | null; // Thông tin user
  token: string | null; // JWT Token
  isAuthenticated: boolean; // Trạng thái đăng nhập (true/false)
  isLoading: boolean; // Trạng thái (đang check login hay chưa)
  login: (data: any) => Promise<void>; // Hàm login (nên thay 'any' bằng LoginData)
  logout: () => void; // Hàm logout
  setAuthData: (user: User, token: string) => void;
}

// 3. Tạo Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 4. Tạo Provider Component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Bắt đầu ở true
  const router = useRouter();

  // 5. [useEffect] Tự động kiểm tra đăng nhập khi tải trang
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("authToken");
      const storedUser = localStorage.getItem("authUser");

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        // (Tùy chọn: gọi API /Auth/me để xác thực token)
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu auth từ localStorage:", error);
      localStorage.removeItem("authToken");
      localStorage.removeItem("authUser");
    } finally {
      setIsLoading(false); // Báo là đã check xong
    }
  }, []);

  // 6. Định nghĩa hàm Login
  const login = async (data: any) => {
    // 'any' nên được thay bằng LoginData
    try {
      const response = await authService.login(data);
      const { username, email, token, roles } = response.data;

      // 2. Kiểm tra dữ liệu từ BODY (chưa cần token)
      if (!token || !username || !email) {
        console.error(
          "Response body bị thiếu token, username, hoặc email:",
          response.data
        );
        throw new Error("Dữ liệu đăng nhập trả về không đầy đủ.");
      }

      // 3. Dùng jwt_decode để giải mã token
      const decodedPayload: any = jwtDecode(token);

      // 4. Lấy dữ liệu từ TOKEN PAYLOAD (Theo lời BE)
      // Chú ý: Tên trường 'id' có thể là 'sub'
      const userId = decodedPayload.id || decodedPayload.sub;
      // Chú ý: Tên trường 'role' có thể là 'roles'
      const userRole = decodedPayload.role || decodedPayload.roles;

      // 5. Kiểm tra dữ liệu từ TOKEN
      if (!userId) {
        console.error(
          "Dữ liệu giải mã từ token bị thiếu 'id' (hoặc 'sub'):",
          decodedPayload
        );
        throw new Error("Token không chứa ID người dùng.");
      }

      // 6. TỔNG HỢP lại đối tượng User từ CẢ HAI NGUỒN
      const userToSave: User = {
        id: userId, // <-- LẤY TỪ TOKEN
        username: username, // <-- LẤY TỪ RESPONSE BODY
        email: email, // <-- LẤY TỪ RESPONSE BODY
        role: userRole || (roles && roles.length > 0 ? roles[0] : "reader"), // Lấy từ token, dự phòng lấy từ body
      };
      // --- KẾT THÚC SỬA ---

      // Lưu vào state
      setUser(userToSave);
      setToken(token);

      // Lưu vào localStorage
      localStorage.setItem("authUser", JSON.stringify(userToSave));
      localStorage.setItem("authToken", token);

      // Chuyển hướng
      router.push("/");
      toast.success(`Chào mừng trở lại, ${userToSave.username}!`);
    } catch (error: any) {
      console.error("Lỗi đăng nhập:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Đăng nhập thất bại. Vui lòng thử lại.";
      toast.error(errorMessage);
      throw error;
    }
  };

  // 7. Định nghĩa hàm Logout
  const logout = () => {
    // (Tùy chọn) Gọi API logout của backend trước
    authService
      .logout()
      .catch((err) => console.error("Lỗi gọi API logout:", err));

    // Xóa khỏi state
    setUser(null);
    setToken(null);

    // Xóa khỏi localStorage
    localStorage.removeItem("authUser");
    localStorage.removeItem("authToken");

    // Chuyển hướng về trang login
    router.push("/login");
    toast.success("Bạn đã đăng xuất.");
  };

  const setAuthData = (user: User, token: string) => {
    // Lưu vào state
    setUser(user);
    setToken(token);

    // Lưu vào localStorage
    localStorage.setItem("authUser", JSON.stringify(user));
    localStorage.setItem("authToken", token);

    // Chuyển hướng
    router.push("/");
    toast.success(`Chào mừng trở lại, ${user.username}!`);
  };

  // 9. Giá trị cung cấp
  const value = {
    user,
    token,
    isAuthenticated: !!token,
    isLoading,
    login, // Hàm login bằng email/pass
    logout,
    setAuthData, // <-- Thêm hàm mới vào đây
  };

  // Chỉ render children khi đã kiểm tra xong (tránh "giật" UI)
  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

// 9. (QUAN TRỌNG) Custom Hook
// Giúp các component khác gọi `useAuth()`
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth phải được dùng bên trong AuthProvider");
  }
  return context;
};
