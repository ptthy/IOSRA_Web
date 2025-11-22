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
import { authorUpgradeService } from "@/services/authorUpgradeService";

export interface User {
  id: string;
  username: string;
  email: string;
  role?: string;
  roles?: string[];
  displayName?: string;
  avatar?: string;
  isPremium?: boolean;
  isAuthorApproved?: boolean;
  bio?: string;
  gender?: "M" | "F" | "other" | "unspecified" | "";
  birthday?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isPremium: boolean;
  isAuthor: boolean;
  login: (data: any) => Promise<void>;
  logout: () => void;
  setAuthData: (user: User, token: string) => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper xác định role chính
const getPrimaryRole = (roles: string[]): string => {
  if (!roles || roles.length === 0) return "reader";
  if (roles.includes("admin")) return "admin";
  if (roles.includes("omod")) return "omod";
  if (roles.includes("cmod")) return "cmod";
  if (roles.includes("author")) return "author";
  return roles[0] || "reader";
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hàm check API phụ
  const checkApprovedStatus = async (): Promise<boolean> => {
    try {
      const response = await authorUpgradeService.getMyRequests();
      return response.data.some((req) => req.status === "approved");
    } catch (error) {
      return false;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem("authToken");
        const storedUser = localStorage.getItem("authUser");

        if (storedToken && storedUser) {
          const parsedUser: User = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
          if (!parsedUser.avatar) {
            authService
              .getMyProfile()
              .then((res) => {
                const updated = {
                  ...parsedUser,
                  avatar: res.data.avatarUrl || null,
                };
                setUser(updated);
                localStorage.setItem("authUser", JSON.stringify(updated));
              })
              .catch(() => {});
          }

          // Check ngầm lại nếu cần
          if (
            !parsedUser.isAuthorApproved &&
            !parsedUser.roles?.includes("author")
          ) {
            const isApproved = await checkApprovedStatus();
            if (isApproved) {
              const updatedUser = { ...parsedUser, isAuthorApproved: true };
              setUser(updatedUser);
              localStorage.setItem("authUser", JSON.stringify(updatedUser));
            }
          }
        }
      } catch (error) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(
    async (data: any) => {
      try {
        const response = await authService.login(data);

        const {
          accountId,
          username,
          email,
          token,
          roles: backendRoles = [],
        } = response.data;

        if (!token) throw new Error("Không có token.");

        const decodedPayload: any = jwtDecode(token);

        const rawRoles =
          backendRoles.length > 0 ? backendRoles : decodedPayload.roles || [];
        const userRoles = (Array.isArray(rawRoles) ? rawRoles : [rawRoles]).map(
          (r: string) => r.toLowerCase().trim()
        );

        const primaryRole = getPrimaryRole(userRoles);

        // Check author approved (giữ nguyên logic cũ của bạn)
        let isApproved = userRoles.includes("author");
        if (!isApproved && primaryRole === "reader") {
          try {
            const reqRes = await authorUpgradeService.getMyRequests();
            isApproved = reqRes.data.some(
              (req: any) => req.status === "approved"
            );
          } catch (e) {}
        }

        // Bước 1: Lưu tạm user để qua loading nhanh
        const tempUser: User = {
          id: accountId || decodedPayload.sub,
          username,
          email,
          role: primaryRole,
          roles: userRoles,
          isPremium: false,
          isAuthorApproved: isApproved,
          displayName: username,
          avatar: undefined,
        };

        setUser(tempUser);
        setToken(token);
        localStorage.setItem("authUser", JSON.stringify(tempUser));
        localStorage.setItem("authToken", token);

        // Bước 2: Lấy avatar + displayName từ /api/Profile (chỉ mất ~300ms)
        let avatarUrl = null;
        let displayName = username;

        try {
          const profileRes = await authService.getMyProfile();
          avatarUrl = profileRes.data.avatarUrl || null;
          displayName = profileRes.data.displayName || username; // nếu sau này có displayName thật
        } catch (err) {
          console.warn("Không lấy được avatar từ /api/Profile");
        }

        // Bước 3: Cập nhật lại user đầy đủ
        const finalUser: User = {
          ...tempUser,
          avatar: avatarUrl,
          displayName,
        };

        setUser(finalUser);
        localStorage.setItem("authUser", JSON.stringify(finalUser));

        // Redirect như cũ
        let redirectPath = "/";
        if (primaryRole === "omod") redirectPath = "/Op/dashboard";
        else if (primaryRole === "cmod") redirectPath = "/Content/dashboard";
        else if (primaryRole === "admin") redirectPath = "/admin/dashboard";

        router.push(redirectPath);
        toast.success(`Chào mừng, ${displayName}!`);
      } catch (error: any) {
        console.error("Lỗi đăng nhập:", error);
        const message = error.response?.data?.message || "Đăng nhập thất bại.";
        toast.error(message);
        throw error;
      }
    },
    [router]
  );
  const logout = useCallback(() => {
    authService.logout().catch(() => {});
    setUser(null);
    setToken(null);
    localStorage.removeItem("authUser");
    localStorage.removeItem("authToken");
    router.push("/login");
    toast.success("Đã đăng xuất.");
  }, [router]);

  const setAuthData = useCallback(
    (user: User, token: string) => {
      setUser(user);
      setToken(token);
      localStorage.setItem("authUser", JSON.stringify(user));
      localStorage.setItem("authToken", token);
      router.push("/");
    },
    [router]
  );

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem("authUser", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ✅ LOGIC NAVBAR
  const isAuthor = user?.isAuthorApproved || false;

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token,
    isLoading,
    isPremium: user?.isPremium || false,
    isAuthor,
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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth phải được dùng trong AuthProvider");
  return context;
};
