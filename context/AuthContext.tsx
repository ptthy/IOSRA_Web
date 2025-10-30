"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  // 1. IMPORT THÊM useCallback
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { toast } from "sonner";
import { authService } from "@/services/authService";

// Interface User và AuthContextType giữ nguyên
export interface User {
  id: string;
  username: string;
  email: string;
  role?: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  gender?: "M" | "F" | "other" | "unspecified" | "";
  birthday?: string;
  password?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  logout: () => void;
  setAuthData: (user: User, token: string) => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("authToken");
      const storedUser = localStorage.getItem("authUser");

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu auth từ localStorage:", error);
      localStorage.removeItem("authToken");
      localStorage.removeItem("authUser");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. BỌC HÀM login BẰNG useCallback
  const login = useCallback(
    async (data: any) => {
      try {
        const response = await authService.login(data);
        const { username, email, token, roles } = response.data;

        if (!token || !username || !email) {
          throw new Error("Dữ liệu đăng nhập trả về không đầy đủ.");
        }

        const decodedPayload: any = jwtDecode(token);

        const userToSave: User = {
          id: decodedPayload.id || decodedPayload.sub,
          username,
          email,
          // SỬA LỖI MAPPING (TỪ HÌNH ẢNH API)
          // API login trả về `username`, gán nó cho cả `displayName`
          displayName: username,
          // ---
          role:
            decodedPayload.role ||
            decodedPayload.roles ||
            (roles && roles[0]) ||
            "reader",
        };

        setUser(userToSave);
        setToken(token);

        localStorage.setItem("authUser", JSON.stringify(userToSave));
        localStorage.setItem("authToken", token);

        router.push("/");
        toast.success(`Chào mừng trở lại, ${userToSave.username}!`);
      } catch (error: any) {
        console.error("Lỗi đăng nhập:", error);
        const message =
          error.response?.data?.message ||
          error.message ||
          "Đăng nhập thất bại. Vui lòng thử lại.";
        toast.error(message);
        throw error;
      }
    },
    [router] // Phụ thuộc vào router
  );

  // 3. BỌC HÀM logout BẰNG useCallback
  const logout = useCallback(() => {
    authService
      .logout()
      .catch((err) => console.error("Lỗi gọi API logout:", err));

    setUser(null);
    setToken(null);
    localStorage.removeItem("authUser");
    localStorage.removeItem("authToken");

    router.push("/login");
    toast.success("Bạn đã đăng xuất.");
  }, [router]); // Phụ thuộc vào router

  // 4. BỌC HÀM updateUser BẰNG useCallback (SỬA LỖI QUAN TRỌNG NHẤT)
  const updateUser = useCallback((updates: Partial<User>) => {
    // Dùng "functional update" để hàm này không phụ thuộc vào state `user`
    setUser((currentUser) => {
      if (!currentUser) return null;

      const updatedUser = { ...currentUser, ...updates };
      // Cập nhật localStorage ngay bên trong
      localStorage.setItem("authUser", JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []); // <-- Mảng phụ thuộc rỗng. Hàm này giờ đã ổn định 100%

  // 5. BỌC HÀM setAuthData BẰNG useCallback
  const setAuthData = useCallback(
    (user: User, token: string) => {
      setUser(user);
      setToken(token);

      localStorage.setItem("authUser", JSON.stringify(user));
      localStorage.setItem("authToken", token);

      router.push("/");
      toast.success(`Chào mừng, ${user.username}!`);
    },
    [router] // Phụ thuộc vào router
  );

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token,
    isLoading,
    login,
    logout,
    setAuthData,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

// Hook `useAuth` giữ nguyên
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth phải được sử dụng bên trong AuthProvider");
  }
  return context;
};
