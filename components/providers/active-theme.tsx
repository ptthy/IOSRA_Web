//components/providers/active-theme.tsx
/*
MỤC ĐÍCH:
Quản lý theme custom của ứng dụng (khác với dark/light mode cơ bản).
Cho phép người dùng chọn các theme màu sắc, kích thước khác nhau.

CHỨC NĂNG CHÍNH:
1. Lưu trữ theme hiện tại trong state và Context API
2. Đồng bộ theme với cookie để duy trì qua các lần truy cập
3. Áp dụng theme vào DOM bằng cách thêm/remove CSS classes
4. Cung cấp custom hook (useThemeConfig) để components con truy cập theme

CÁCH HOẠT ĐỘNG:
- Khi theme thay đổi → cập nhật cookie và DOM
- Khi page reload → đọc cookie để khôi phục theme
- Hỗ trợ cả SSR (Server-Side Rendering) và CSR (Client-Side Rendering)
*/
"use client";

import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
/**
 * Tên cookie để lưu theme đang active
 */
const COOKIE_NAME = "active_theme";
/**
 * Theme mặc định nếu không có theme nào được chọn
 */
const DEFAULT_THEME = "default";
/**
 * Hàm lưu theme vào cookie để duy trì trạng thái giữa các lần truy cập
 * @param theme - Tên theme cần lưu
 */
function setThemeCookie(theme: string) {
  // Chỉ chạy phía client, không chạy trên server
  if (typeof window === "undefined") return;

  // Tạo cookie với các thuộc tính:
  // - path=/: có hiệu lực trên toàn bộ site
  // - max-age=31536000: hết hạn sau 1 năm (tính bằng giây)
  // - SameSite=Lax: hạn chế CSRF, cho phép gửi cookie trong một số trường hợp
  // - Secure: chỉ gửi qua HTTPS nếu đang dùng giao thức bảo mật
  document.cookie = `${COOKIE_NAME}=${theme}; path=/; max-age=31536000; SameSite=Lax; ${
    window.location.protocol === "https:" ? "Secure;" : ""
  }`;
}
/**
 * Hàm áp dụng theme vào các phần tử HTML (body và html)
 * @param theme - Tên theme cần áp dụng
 */
function applyThemeToElements(theme: string) {
  // Chỉ chạy phía client
  if (typeof window === "undefined") return;
  // Các phần tử cần cập nhật class theme
  const elementsToUpdate = [document.body, document.documentElement];

  elementsToUpdate.forEach((element) => {
    /**
     * 1. Xóa tất cả class theme cũ:
     * - Lấy tất cả class của phần tử
     * - Lọc ra các class bắt đầu bằng "theme-"
     * - Xóa từng class cũ đi
     */
    Array.from(element.classList)
      .filter((className) => className.startsWith("theme-"))
      .forEach((className) => {
        element.classList.remove(className);
      });

    /**
     * 2. Thêm class theme mới:
     * - Thêm class chính: `theme-{tên}`
     * - Nếu theme kết thúc bằng "-scaled" thì thêm class "theme-scaled"
     *   (dùng cho trường hợp có scaling/zoom đặc biệt)
     */
    element.classList.add(`theme-${theme}`);
    if (theme.endsWith("-scaled")) {
      element.classList.add("theme-scaled");
    }
  });
}
/**
 * Type định nghĩa cho Context API:
 * - activeTheme: theme hiện tại
 * - setActiveTheme: hàm để thay đổi theme
 */
type ThemeContextType = {
  activeTheme: string;
  setActiveTheme: (theme: string) => void;
};
/**
 * Tạo Context để chia sẻ state theme trong toàn bộ ứng dụng
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
/**
 * Provider component quản lý theme active
 * @param children - Các component con
 * @param initialTheme - Theme khởi tạo từ server (SSR) hoặc cookie
 */
export function ActiveThemeProvider({
  children,
  initialTheme,
}: {
  children: ReactNode;
  initialTheme?: string;
}) {
  /**
   * State lưu theme hiện tại, khởi tạo từ prop hoặc mặc định
   */
  const [activeTheme, setActiveTheme] = useState<string>(
    () => initialTheme || DEFAULT_THEME
  );
  /**
   * useEffect chỉ chạy 1 lần khi component mount:
   * - Áp dụng theme vào DOM
   * - Lưu vào cookie
   * - Chạy sau khi render để đảm bảo DOM đã sẵn sàng
   */
  useEffect(() => {
    const themeToApply = activeTheme || DEFAULT_THEME;
    applyThemeToElements(themeToApply);

    setThemeCookie(themeToApply);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Mảng dependency rỗng = chỉ chạy 1 lần
  /**
   * useEffect theo dõi thay đổi của activeTheme:
   * - Mỗi khi theme thay đổi -> lưu cookie và áp dụng vào DOM
   */
  useEffect(() => {
    setThemeCookie(activeTheme);
    applyThemeToElements(activeTheme);
  }, [activeTheme]); // Chạy lại mỗi khi activeTheme thay đổi

  return (
    <ThemeContext.Provider value={{ activeTheme, setActiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Custom hook để sử dụng theme context
 * @returns {ThemeContextType} Context chứa activeTheme và setActiveTheme
 * @throws Error nếu dùng bên ngoài ActiveThemeProvider
 */
export function useThemeConfig() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error(
      "useThemeConfig must be used within an ActiveThemeProvider"
    );
  }
  return context;
}
