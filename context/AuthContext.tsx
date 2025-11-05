// contexts/AuthContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { toast } from "sonner";
import { authService } from "@/services/authService";

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
  isAuthor: boolean;
  login: (data: any) => Promise<void>;
  logout: () => void;
  setAuthData: (user: User, token: string) => void;
  updateUser: (updates: Partial<User>) => void;
  updateUserRole: (role: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hàm Helper để xác định Role chính
const getPrimaryRole = (roles: string[]): string => {
  if (!roles || roles.length === 0) return "reader";

  // Ưu tiên các role quản trị
  if (roles.includes("admin")) return "admin";
  if (roles.includes("omod")) return "omod";
  if (roles.includes("cmod")) return "cmod";

  // Ưu tiên Author hơn Reader
  if (roles.includes("author")) return "author";

  // Mặc định là reader nếu không có role nào khác
  return roles[0] || "reader";
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthor, setIsAuthor] = useState(false);

  // Khởi tạo từ localStorage
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("authToken");
      const storedUser = localStorage.getItem("authUser");

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        setIsAuthor(parsedUser.role === "author");
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu auth từ localStorage:", error);
      localStorage.removeItem("authToken");
      localStorage.removeItem("authUser");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Hàm login
  const login = useCallback(
    async (data: any) => {
      try {
        const response = await authService.login(data);
        const { username, email, token, roles } = response.data;

        if (!token || !username || !email) {
          throw new Error("Dữ liệu đăng nhập trả về không đầy đủ.");
        }

        const decodedPayload: any = jwtDecode(token);
        const userRoles = roles || decodedPayload.roles || [];

        const userToSave: User = {
          id: decodedPayload.id || decodedPayload.sub,
          username,
          email,
          displayName: username,
          role: getPrimaryRole(userRoles),
        };

        setUser(userToSave);
        setToken(token);
        setIsAuthor(userToSave.role === "author");

        localStorage.setItem("authUser", JSON.stringify(userToSave));
        localStorage.setItem("authToken", token);

        // Logic chuyển hướng
        const role = userToSave.role;
        let redirectPath = "/";

        if (role === "omod") {
          redirectPath = "/Op/dashboard";
        } else if (role === "cmod") {
          redirectPath = "/Content/dashboard";
        } else if (role === "admin") {
          redirectPath = "/admin/dashboard";
        }

        router.push(redirectPath);
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
    [router]
  );

  // Hàm logout
  const logout = useCallback(() => {
    authService
      .logout()
      .catch((err) => console.error("Lỗi gọi API logout:", err));

    setUser(null);
    setToken(null);
    setIsAuthor(false);
    localStorage.removeItem("authUser");
    localStorage.removeItem("authToken");

    router.push("/login");
    toast.success("Bạn đã đăng xuất.");
  }, [router]);

  // Cập nhật thông tin user
  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((currentUser) => {
      if (!currentUser) return null;

      const updatedUser = { ...currentUser, ...updates };
      localStorage.setItem("authUser", JSON.stringify(updatedUser));

      // Cập nhật isAuthor nếu role thay đổi
      if (updates.role !== undefined) {
        setIsAuthor(updates.role === "author");
      }

      return updatedUser;
    });
  }, []);

  // Set auth data
  const setAuthData = useCallback(
    (user: User, token: string) => {
      setUser(user);
      setToken(token);
      setIsAuthor(user.role === "author");

      localStorage.setItem("authUser", JSON.stringify(user));
      localStorage.setItem("authToken", token);

      // Logic chuyển hướng
      const role = user.role;
      let redirectPath = "/";

      if (role === "omod") {
        redirectPath = "/Op/dashboard";
      } else if (role === "cmod") {
        redirectPath = "/Content/dashboard";
      } else if (role === "admin") {
        redirectPath = "/admin/dashboard";
      }

      router.push(redirectPath);
      toast.success(`Chào mừng, ${user.username}!`);
    },
    [router]
  );

  // Cập nhật role user
  const updateUserRole = useCallback((role: string) => {
    setUser((currentUser) => {
      if (!currentUser) return null;

      const updatedUser = { ...currentUser, role };
      localStorage.setItem("authUser", JSON.stringify(updatedUser));

      // Cập nhật isAuthor dựa trên role
      setIsAuthor(role === "author");

      return updatedUser;
    });
  }, []);

  // Đồng bộ isAuthor khi user thay đổi
  useEffect(() => {
    if (user) {
      setIsAuthor(user.role === "author");
    }
  }, [user]);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token,
    isLoading,
    isAuthor,
    login,
    logout,
    setAuthData,
    updateUser,
    updateUserRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth phải được sử dụng bên trong AuthProvider");
  }
  return context;
};
