/**
 * AUTH CONTEXT - QUẢN LÝ TRẠNG THÁI XÁC THỰC TOÀN ỨNG DỤNG
 * MỤC ĐÍCH: Cung cấp authentication state cho toàn bộ ứng dụng React
 * CHỨC NĂNG CHÍNH:
 * 1. Lưu trữ thông tin user, token, trạng thái đăng nhập
 * 2. Xử lý login/logout
 * 3. Đồng bộ với localStorage và cookies
 * 4. Refresh token tự động
 * 5. Phân quyền dựa trên role
 * LIÊN THÔNG VỚI:
 * - middleware.ts (qua cookie authUser)
 * - apiClient.ts (qua token trong localStorage)
 * - Các component qua useAuth()
 * - Backend API qua authService
 */
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useRouter } from "next/navigation"; // Next.js router để chuyển trang
import { jwtDecode } from "jwt-decode"; // Thư viện decode JWT token
import { toast } from "sonner"; // Hiển thị thông báo popup
import { authService } from "@/services/authService"; // Service gọi API auth
import { authorUpgradeService } from "@/services/authorUpgradeService";
import { refreshToken } from "@/services/apiClient";
// Danh sách role của Staff (admin, moderator)
// TẠI SAO CẦN: Để phân biệt staff với reader/author trong logic xử lý
const STAFF_ROLES = ["admin", "omod", "cmod"];

// ============================================
// 1. ĐỊNH NGHĨA INTERFACE (KIỂU DỮ LIỆU)
// MỤC ĐÍCH: Đảm bảo type safety trong TypeScript
// ============================================

// Interface cho User object
// CÁC THUỘC TÍNH QUAN TRỌNG:
// - roles: Mảng roles từ backend (có thể nhiều role)
// - isAuthorApproved: Flag xác định đã được approve làm author chưa
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
// Interface cho AuthContext (các giá trị và hàm sẽ cung cấp)
interface AuthContextType {
  user: User | null; // Thông tin user hiện tại
  token: string | null; // JWT token
  isAuthenticated: boolean; // Đã đăng nhập chưa
  isLoading: boolean; // Đang loading authentication
  isPremium: boolean; // Có phải premium không
  isAuthor: boolean; // Có phải author không
  login: (data: any) => Promise<void>; // Hàm đăng nhập
  logout: () => void; // Hàm đăng xuất
  setAuthData: (user: User, token: string) => void; // Set auth data (dùng cho OAuth)
  updateUser: (updates: Partial<User>) => void; // Cập nhật thông tin user
  refreshAndUpdateUser: () => Promise<void>; // Refresh token và cập nhật user
}
// ============================================
// 2. TẠO CONTEXT VÀ HELPER FUNCTIONS
// ============================================

// Tạo React Context với kiểu AuthContextType, khởi tạo là undefined
// TẠI SAO: Context giúp truyền auth state xuống mọi component mà không cần prop drilling
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function: Xác định role chính từ mảng roles
// LOGIC ƯU TIÊN: admin > omod > cmod > author > reader
// TẠI SAO: User có thể có nhiều role, cần xác định role cao nhất để điều hướng
const getPrimaryRole = (roles: string[]): string => {
  if (!roles || roles.length === 0) return "reader"; // Mặc định là reader
  // Ưu tiên role theo thứ tự: admin > omod > cmod > author > reader
  if (roles.includes("admin")) return "admin";
  if (roles.includes("omod")) return "omod";
  if (roles.includes("cmod")) return "cmod";
  if (roles.includes("author")) return "author";
  return roles[0] || "reader"; // Lấy role đầu tiên nếu không có role đặc biệt
};
// ============================================
// 3. AUTH PROVIDER COMPONENT
// ============================================

// AuthProvider: Component wrapper cung cấp auth context cho toàn app
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter(); // Next.js router hook
  const [user, setUser] = useState<User | null>(null); // User info
  const [token, setToken] = useState<string | null>(null); // JWT token
  const [isLoading, setIsLoading] = useState(true); // Loading state
  // ============================================
  // 3.1. HELPER FUNCTIONS
  // ============================================

  /**
   * Hàm helper để lưu user vào cookies (cho middleware đọc)
   * MỤC ĐÍCH: Đồng bộ user state giữa client và server-side middleware
   * CƠ CHẾ: Lưu JSON string của user vào cookie với expiry 7 ngày
   * TẠI SAO CẦN COOKIE: Middleware chạy trên server, không truy cập được localStorage
   */
  const setUserCookie = (user: User | null) => {
    if (typeof window === "undefined") return; // Không chạy trên server

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

  /**
   * Hàm check API phụ: Kiểm tra user có được approve làm author chưa
   * MỤC ĐÍCH: Reader có thể đã được approve nhưng chưa có role "author" trong token
   * CƠ CHẾ: Gọi API lấy danh sách request upgrade, kiểm tra có request nào approved
   * TẠI SAO CẦN: Đảm bảo UI hiển thị đúng trạng thái author
   */
  const checkApprovedStatus = async (): Promise<boolean> => {
    try {
      const response = await authorUpgradeService.getMyRequests(); // Gọi API
      return response.data.some((req) => req.status === "approved"); // Check có request nào approved
    } catch (error) {
      return false; // Nếu lỗi, mặc định là false
    }
  };

  // ============================================
  // 3.2. EFFECT: KHỞI TẠO AUTH KHI APP LOAD
  // MỤC ĐÍCH: Khôi phục session từ localStorage khi user refresh trang
  // CƠ CHẾ: Lấy token và user từ localStorage -> validate -> cập nhật state
  // ============================================

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Lấy token và user từ localStorage (nếu có từ session trước)
        const storedToken = localStorage.getItem("authToken");
        const storedUser = localStorage.getItem("authUser");

        if (storedToken && storedUser) {
          const parsedUser: User = JSON.parse(storedUser); // Parse JSON string
          // Cập nhật state với dữ liệu đã lưu
          setToken(storedToken);
          setUser(parsedUser);
          setUserCookie(parsedUser); // Lưu vào cookie cho middleware

          // Chỉ lấy avatar mới nếu user KHÔNG phải là staff
          const isStaff = STAFF_ROLES.includes(parsedUser.role || "");
          // SỬA: Thêm && !isStaff vào điều kiện
          if (!parsedUser.avatar && !isStaff) {
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
              .catch(() => {}); // Nếu lỗi, bỏ qua (giữ avatar cũ)
          }

          // Check ngầm lại nếu cần (CHỈ cho reader, KHÔNG cho staff)
          // TẠI SAO: Reader có thể vừa được approve trong khi đang online
          if (
            !isStaff &&
            !parsedUser.isAuthorApproved &&
            !parsedUser.roles?.includes("author")
          ) {
            const isApproved = await checkApprovedStatus(); // Gọi API check
            if (isApproved) {
              // Nếu được approve, cập nhật state
              const updatedUser = { ...parsedUser, isAuthorApproved: true };
              setUser(updatedUser);
              localStorage.setItem("authUser", JSON.stringify(updatedUser));
              setUserCookie(updatedUser); // Cập nhật cookie
            }
          }
        }
      } catch (error) {
        // Nếu có lỗi (JSON parse fail, etc.), xóa dữ liệu cũ
        // TẠI SAO: Tránh trường hợp data corrupt gây lỗi ứng dụng
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
      } finally {
        setIsLoading(false); // Dừng loading
      }
    };

    initAuth(); // Gọi hàm khởi tạo
  }, []); // Chạy 1 lần khi component mount
  // ============================================
  // 3.3. LOGIN FUNCTION
  // MỤC ĐÍCH: Xử lý đăng nhập với API backend
  // FLOW: Gọi API -> decode token -> lấy role -> lấy avatar -> redirect
  // ============================================
  const login = useCallback(
    async (data: any) => {
      try {
        // 1. Gọi API login
        const response = await authService.login(data);
        // 2. Destructure data từ response
        const {
          accountId,
          username,
          email,
          token,
          roles: backendRoles = [],
        } = response.data;

        if (!token) throw new Error("Không có token.");
        // 3. Decode JWT token để lấy thông tin
        const decodedPayload: any = jwtDecode(token);
        // 4. Xử lý roles: Ưu tiên roles từ backend, sau đó từ token
        const rawRoles =
          backendRoles.length > 0 ? backendRoles : decodedPayload.roles || [];
        const userRoles = (Array.isArray(rawRoles) ? rawRoles : [rawRoles]).map(
          (r: string) => r.toLowerCase().trim() // Chuẩn hóa: lowercase và trim
        );
        // 5. Xác định role chính
        const primaryRole = getPrimaryRole(userRoles);

        // 6. Check author approved status
        let isApproved = userRoles.includes("author"); // Nếu có role "author" trong roles
        // Nếu là reader, check API xem có request nào approved không
        if (!isApproved && primaryRole === "reader") {
          try {
            const reqRes = await authorUpgradeService.getMyRequests();
            isApproved = reqRes.data.some(
              (req: any) => req.status === "approved"
            );
          } catch (e) {
            // Nếu lỗi API, giữ nguyên isApproved = false
          }
        }

        // Bước 1: Lưu tạm user để qua loading nhanh (optimistic update)
        // TẠI SAO: Cải thiện UX, user thấy đăng nhập thành công ngay
        const tempUser: User = {
          id: accountId || decodedPayload.sub, // ID từ backend hoặc từ token
          username,
          email,
          role: primaryRole,
          roles: userRoles,
          isPremium: false, // Mặc định false, có thể update sau
          isAuthorApproved: isApproved,
          displayName: username, // Tạm dùng username làm displayName
          avatar: undefined, // Chưa có avatar
        };
        // Cập nhật state và storage với temp user
        setUser(tempUser);
        setToken(token);
        localStorage.setItem("authUser", JSON.stringify(tempUser));
        localStorage.setItem("authToken", token);
        setUserCookie(tempUser); // Lưu vào cookie cho middleware

        // Bước 2: Lấy avatar + displayName từ /api/Profile
        let avatarUrl = null;
        let displayName = username;

        // Chỉ gọi API nếu KHÔNG PHẢI là staff (staff không cần avatar)
        // TẠI SAO: Tiết kiệm API call, staff dashboard không hiển thị avatar
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
        // Cập nhật state và storage với final user
        setUser(finalUser);
        localStorage.setItem("authUser", JSON.stringify(finalUser));
        setUserCookie(finalUser); // Cập nhật cookie với thông tin đầy đủ

        // 7. Redirect theo role
        // LOGIC ĐIỀU HƯỚNG: Mỗi role có dashboard riêng
        let redirectPath = "/";
        if (primaryRole === "omod") redirectPath = "/Op/dashboard";
        else if (primaryRole === "cmod")
          redirectPath = "/Content/review?tab=history";
        else if (primaryRole === "admin") redirectPath = "/Admin";

        router.push(redirectPath); // Chuyển trang
        toast.success(`Chào mừng, ${displayName}!`);
      } catch (error: any) {
        console.error("Lỗi đăng nhập:", error);
        const message = error.response?.data?.message || "Đăng nhập thất bại.";
        toast.error(message); // Hiện thông báo lỗi
        throw error; // Throw error để component có thể catch
      }
    },
    [router] // Dependency: chỉ phụ thuộc vào router
  );

  // ============================================
  // 3.4. LOGOUT FUNCTION
  // MỤC ĐÍCH: Xóa toàn bộ thông tin authentication
  // FLOW: Gọi API logout -> xóa state -> xóa storage -> redirect
  // ============================================
  const logout = useCallback(() => {
    // 1. Gọi API logout (server sẽ xóa refresh token)
    authService.logout().catch(() => {}); // Bỏ qua lỗi nếu có
    // 2. Xóa state
    setUser(null);
    setToken(null);
    // 3. Xóa localStorage
    localStorage.removeItem("authUser");
    localStorage.removeItem("authToken");
    // 4. Xóa cookie
    setUserCookie(null); // Xóa cookie
    // 5. Redirect về trang login
    router.push("/login");
    toast.success("Đã đăng xuất.");
  }, [router]);

  // ============================================
  // 3.5. SET AUTH DATA (DÙNG CHO OAUTH)
  // MỤC ĐÍCH: Xử lý đăng nhập qua OAuth (Google, Facebook)
  // KHÁC BIỆT VỚI LOGIN: Nhận user và token trực tiếp, không cần gọi API login
  // ============================================
  const setAuthData = useCallback(
    async (user: User, token: string) => {
      try {
        // (Để authService.getMyProfile bên dưới có token mà gọi)
        // 1. Lưu token vào localStorage NGAY LẬP TỨC
        localStorage.setItem("authToken", token);

        let finalUser = { ...user }; // Clone user object

        // 2. Lấy role chínhđể check xem có phải admin/mod không
        const primaryRole = user.role || getPrimaryRole(user.roles || []);

        // 3. Nếu không phải Staff -> Gọi API lấy Avatar & DisplayName mới nhất
        // TẠI SAO: OAuth có thể trả về avatar cũ, cần lấy mới nhất từ backend
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

        // 5. Chuyển hướng về trang chủ
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

  // ============================================
  // 3.6. UPDATE USER FUNCTION
  // MỤC ĐÍCH: Cập nhật thông tin user (avatar, displayName, email...)
  // SỬ DỤNG KHI: User update profile, change avatar,...
  // ============================================
  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null; // Nếu không có user, return null
      const updated = { ...prev, ...updates }; // Merge updates vào user cũ
      localStorage.setItem("authUser", JSON.stringify(updated)); // Update localStorage
      setUserCookie(updated); // Cập nhật cookie
      return updated; // Return user mới
    });
  }, []);

  // ============================================
  // 3.7. REFRESH TOKEN AND UPDATE USER
  // MỤC ĐÍCH: Tự động refresh token khi sắp hết hạn
  // ĐƯỢC GỌI BỞI: apiClient interceptor khi nhận 401/403
  // ============================================

  const refreshAndUpdateUser = useCallback(async () => {
    try {
      // 1. Gọi refresh token (hàm từ apiClient.ts)
      const newToken = await refreshToken();

      if (!newToken) {
        throw new Error("Không nhận được token mới");
      }

      // 2. Decode token để lấy thông tin user
      const decodedPayload: any = jwtDecode(newToken);

      // 3. Lấy roles từ token
      const rawRoles = decodedPayload.roles || [];
      const userRoles = (Array.isArray(rawRoles) ? rawRoles : [rawRoles]).map(
        (r: string) => r.toLowerCase().trim()
      );

      const primaryRole = getPrimaryRole(userRoles);

      // 4. Check author approved
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

      // 5. Lấy thông tin user hiện tại để giữ avatar, displayName
      const currentUser =
        user || JSON.parse(localStorage.getItem("authUser") || "null");

      // 6. Tạo user object mới từ token
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

      // 7. Cập nhật state và storage
      setToken(newToken);
      setUser(updatedUser);
      localStorage.setItem("authToken", newToken);
      localStorage.setItem("authUser", JSON.stringify(updatedUser));
      setUserCookie(updatedUser);

      // 8. Lấy thông tin profile nếu cần
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
  }, [user]); // Dependency: chỉ phụ thuộc vào user

  // ============================================
  // 3.8. COMPUTED VALUES
  // MỤC ĐÍCH: Tính toán các giá trị derived từ user state
  // TẠI SAO: Để component không cần tự tính toán
  // ============================================

  // Tính toán isAuthor từ user.roles hoặc isAuthorApproved
  // LOGIC: Ưu tiên roles.includes("author"), nếu không có thì check isAuthorApproved
  const isAuthor =
    user?.roles?.includes("author") ?? user?.isAuthorApproved ?? false;
  // ============================================
  // 3.9. CONTEXT VALUE
  // MỤC ĐÍCH: Tổng hợp tất cả state và hàm để cung cấp cho context
  // ============================================
  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token, // Chuyển token thành boolean (có token = true)
    isLoading,
    isPremium: user?.isPremium || false,
    isAuthor,
    login,
    logout,
    setAuthData,
    updateUser,
    refreshAndUpdateUser,
  };
  // ============================================
  // 3.10. RETURN PROVIDER
  // ============================================

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
// ============================================
// 4. USE AUTH HOOK
// ============================================
// Custom hook để sử dụng AuthContext trong components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext); // Lấy context
  if (!context) throw new Error("useAuth phải được dùng trong AuthProvider"); // Error boundary
  return context; // Return context value
};
