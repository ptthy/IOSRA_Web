//context/AuthContext.tsx
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
import { refreshToken } from "@/services/apiClient";
const STAFF_ROLES = ["admin", "omod", "cmod"];
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
  refreshAndUpdateUser: () => Promise<void>;
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

  // Hàm helper để lưu user vào cookies (cho middleware)
  const setUserCookie = (user: User | null) => {
    if (typeof window === "undefined") return;

    if (user) {
      // Lưu user vào cookie với thời gian hết hạn 7 ngày
      const expires = new Date();
      expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000);
      document.cookie = `authUser=${encodeURIComponent(
        JSON.stringify(user)
      )}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    } else {
      // Xóa cookie khi logout
      document.cookie = `authUser=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  };

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
          setUserCookie(parsedUser); // Lưu vào cookie
          // Chỉ lấy avatar mới nếu user KHÔNG phải là staff
          const isStaff = STAFF_ROLES.includes(parsedUser.role || "");
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
                setUserCookie(updated); // Cập nhật cookie
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
              setUserCookie(updatedUser); // Cập nhật cookie
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
        setUserCookie(tempUser); // Lưu vào cookie

        // Bước 2: Lấy avatar + displayName từ /api/Profile (chỉ mất ~300ms)
        let avatarUrl = null;
        let displayName = username;

        // Chỉ gọi API nếu KHÔNG PHẢI là staff
        if (!STAFF_ROLES.includes(primaryRole)) {
          try {
            const profileRes = await authService.getMyProfile();
            avatarUrl = profileRes.data.avatarUrl || null;
            displayName = profileRes.data.displayName || username;
          } catch (err) {
            console.warn("Skip profile fetch: Reader profile not found.");
          }
        } else {
          console.log("Skip profile fetch for Staff role:", primaryRole);
        }

        // Bước 3: Cập nhật lại user đầy đủ
        const finalUser: User = {
          ...tempUser,
          avatar: avatarUrl,
          displayName,
        };

        setUser(finalUser);
        localStorage.setItem("authUser", JSON.stringify(finalUser));
        setUserCookie(finalUser); // Cập nhật cookie với thông tin đầy đủ

        // Redirect như cũ
        let redirectPath = "/";
        if (primaryRole === "omod") redirectPath = "/Op/dashboard";
        else if (primaryRole === "cmod") redirectPath = "/Content/dashboard";
        else if (primaryRole === "admin") redirectPath = "/Admin";

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
    setUserCookie(null); // Xóa cookie
    router.push("/login");
    toast.success("Đã đăng xuất.");
  }, [router]);

  // const setAuthData = useCallback(
  //   (user: User, token: string) => {
  //     setUser(user);
  //     setToken(token);
  //     localStorage.setItem("authUser", JSON.stringify(user));
  //     localStorage.setItem("authToken", token);
  //     setUserCookie(user); // Lưu vào cookie
  //     router.push("/");
  //   },
  //   [router]
  // );
  const setAuthData = useCallback(
    async (user: User, token: string) => {
      // 1. Thêm từ khóa async
      try {
        // 2. Lưu token vào localStorage NGAY LẬP TỨC
        // (Để authService.getMyProfile bên dưới có token mà gọi)
        localStorage.setItem("authToken", token);

        let finalUser = { ...user };

        // Lấy role chính để check xem có phải admin/mod không
        const primaryRole = user.role || getPrimaryRole(user.roles || []);

        // 3. Nếu không phải Staff -> Gọi API lấy Avatar & DisplayName mới nhất
        if (!STAFF_ROLES.includes(primaryRole)) {
          try {
            const profileRes = await authService.getMyProfile();
            if (profileRes.data) {
              finalUser = {
                ...finalUser,
                avatar: profileRes.data.avatarUrl || finalUser.avatar, // Ưu tiên avatar từ backend
                displayName:
                  profileRes.data.displayName || finalUser.displayName,
              };
            }
          } catch (err) {
            console.warn(
              "setAuthData: Không lấy được profile bổ sung, dùng data gốc."
            );
          }
        }

        // 4. Cập nhật State và Cookie với user đã có avatar chuẩn
        setUser(finalUser);
        setToken(token);
        localStorage.setItem("authUser", JSON.stringify(finalUser));
        setUserCookie(finalUser);

        // 5. Chuyển hướng
        router.push("/");
      } catch (error) {
        console.error("Lỗi trong setAuthData", error);
        // Fallback: Vẫn cho đăng nhập dù lỗi lấy profile
        setUser(user);
        setToken(token);
        router.push("/");
      }
    },
    [router]
  );

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem("authUser", JSON.stringify(updated));
      setUserCookie(updated); // Cập nhật cookie
      return updated;
    });
  }, []);

  // Hàm refresh token và cập nhật user từ token mới
  const refreshAndUpdateUser = useCallback(async () => {
    try {
      // Gọi refresh token
      const newToken = await refreshToken();

      if (!newToken) {
        throw new Error("Không nhận được token mới");
      }

      // Decode token để lấy thông tin user
      const decodedPayload: any = jwtDecode(newToken);

      // Lấy roles từ token
      const rawRoles = decodedPayload.roles || [];
      const userRoles = (Array.isArray(rawRoles) ? rawRoles : [rawRoles]).map(
        (r: string) => r.toLowerCase().trim()
      );

      const primaryRole = getPrimaryRole(userRoles);

      // Check author approved
      let isApproved = userRoles.includes("author");
      if (!isApproved && primaryRole === "reader") {
        try {
          const reqRes = await authorUpgradeService.getMyRequests();
          isApproved = reqRes.data.some(
            (req: any) => req.status === "approved"
          );
        } catch (e) {
          // Ignore error
        }
      }

      // Lấy thông tin user hiện tại để giữ avatar, displayName
      const currentUser =
        user || JSON.parse(localStorage.getItem("authUser") || "null");

      // Tạo user object mới từ token
      const updatedUser: User = {
        id: decodedPayload.sub || currentUser?.id || "",
        username: decodedPayload.username || currentUser?.username || "",
        email: decodedPayload.email || currentUser?.email || "",
        role: primaryRole as any,
        roles: userRoles,
        isPremium: decodedPayload.isPremium || currentUser?.isPremium || false,
        isAuthorApproved: isApproved,
        displayName: currentUser?.displayName || decodedPayload.username || "",
        avatar: currentUser?.avatar || null,
        bio: currentUser?.bio,
        birthday: currentUser?.birthday,
      };

      // Cập nhật state và storage
      setToken(newToken);
      setUser(updatedUser);
      localStorage.setItem("authToken", newToken);
      localStorage.setItem("authUser", JSON.stringify(updatedUser));
      setUserCookie(updatedUser);

      // Lấy thông tin profile nếu cần
      // Chỉ lấy profile lại nếu KHÔNG phải staff
      if (!STAFF_ROLES.includes(primaryRole)) {
        try {
          const profileRes = await authService.getMyProfile();
          if (profileRes.data) {
            const finalUser: User = {
              ...updatedUser,
              avatar: profileRes.data.avatarUrl || updatedUser.avatar,
              displayName:
                profileRes.data.displayName || updatedUser.displayName,
              bio: profileRes.data.bio || updatedUser.bio,
              birthday: profileRes.data.birthday || updatedUser.birthday,
            };
            setUser(finalUser);
            localStorage.setItem("authUser", JSON.stringify(finalUser));
            setUserCookie(finalUser);
          }
        } catch (err) {
          // Ignore profile error, use token data
          console.warn("Không lấy được profile sau refresh:", err);
        }
      }
    } catch (error: any) {
      console.error("Lỗi refresh token:", error);
      // Nếu refresh thất bại, có thể token đã hết hạn
      // Không throw error để tránh break flow
    }
  }, [user]);

  // ✅ LOGIC NAVBAR
  const isAuthor =
    user?.roles?.includes("author") ?? user?.isAuthorApproved ?? false;

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
    refreshAndUpdateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth phải được dùng trong AuthProvider");
  return context;
};
