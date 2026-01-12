//app/layout.tsx
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils"; // Helper để gộp và xử lý className Tailwind CSS một cách linh hoạt
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Navbar } from "@/components/layout/Navbar";

import { AuthProvider } from "@/context/AuthContext";

import { AppProviders } from "@/components/providers/app-providers";
import { ChatBotWidget } from "@/components/chat/ChatBotWidget";
import { ModalProvider } from "@/context/ModalContext";

/**
 * CẤU HÌNH FONT POPPINS
 *
 * MỤC ĐÍCH: Sử dụng font Poppins cho toàn bộ ứng dụng
 *
 * GIẢI THÍCH CÁC OPTIONS:
 * - subsets: ["latin"]: Chỉ tải ký tự Latin để tối ưu performance
 * - weight: ["400", "500", "600", "700"]: Tải các font-weight cần thiết
 * - variable: "--font-poppins": Tạo CSS variable để sử dụng trong Tailwind
 * - display: "swap": Hiển thị font fallback trước khi font tải xong (FOUT)
 */
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});
/**
 * METADATA CHO TRANG
 *
 * MỤC ĐÍCH: Cung cấp thông tin SEO cho trang
 * - title: Tiêu đề hiển thị trên tab trình duyệt
 * - description: Mô tả ngắn cho SEO
 */
export const metadata: Metadata = {
  title: "Tora Novel",
  description: "Nền tảng đọc truyện tương tác với AI Voice",
};
/**
 * ROOT LAYOUT - LAYOUT GỐC CỦA ỨNG DỤNG
 *
 * MỤC ĐÍCH: Layout wrapper cho toàn bộ ứng dụng
 * CHỨC NĂNG:
 * 1. Thiết lập font chung
 * 2. Quản lý theme (sáng/tối)
 * 3. Cung cấp Auth context cho toàn app
 * 4. Cung cấp Modal context
 * 5. Hiển thị Navbar trên mọi trang
 * 6. Hiển thị ChatBotWidget
 *
 * FLOW RENDER:
 * 1. Server Component: Đọc cookies để lấy theme
 * 2. Render html với các providers lồng nhau
 * 3. Children là nội dung trang cụ thể
 *
 * GIẢI THÍCH CÁC PROVIDERS:
 * - ThemeProvider: Quản lý theme (dark/light)
 * - AuthProvider: Quản lý trạng thái đăng nhập, user info
 * - AppProviders: Custom providers khác (có thể có Toast, QueryClient, etc.)
 * - ModalProvider: Quản lý global modal state
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /**
   * ĐỌC COOKIES TRÊN SERVER
   *
   * MỤC ĐÍCH: Lấy theme từ cookies để áp dụng ngay từ đầu
   * - active_theme: Lưu theme đang chọn (vd: "dark", "light", "dark-scaled")
   * - isScaled: Kiểm tra xem theme có phải là scaled version không (cho accessibility)
   */
  const cookieStore = await cookies();
  const activeThemeValue = cookieStore.get("active_theme")?.value;
  const isScaled = activeThemeValue?.endsWith("-scaled");

  return (
    <html lang="vi" suppressHydrationWarning>
      {/**
       * suppressHydrationWarning:
       * - Ngăn warning khi có sự không khớp giữa server và client render
       * - Cần thiết vì theme được áp dụng dynamic trên client
       */}
      <body
        className={cn(
          poppins.variable, // Thêm CSS variable cho font
          activeThemeValue ? `theme-${activeThemeValue}` : "", // Thêm class theme
          isScaled ? "theme-scaled" : "" // Thêm class scale nếu cần
        )}
      >
        {/**
         * THEME PROVIDER
         *
         * attribute="class": Sử dụng class để toggle theme (thay vì data-theme)
         * defaultTheme="system": Mặc định dùng theme của hệ thống
         * enableSystem: Cho phép phát hiện system theme
         */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {/**
           * AUTH PROVIDER
           *
           * Cung cấp context cho authentication
           * - user: Thông tin user đăng nhập
           * - isAuthenticated: Trạng thái đăng nhập
           * - login/logout functions
           */}
          <AuthProvider>
            {/**
             * APP PROVIDERS
             *
             * Custom providers wrapper, có thể chứa:
             * - Toast provider
             * - React Query provider
             * - React Router provider
             * - Các context khác
             */}
            <AppProviders activeThemeValue={activeThemeValue}>
              {/**
               * MODAL PROVIDER
               *
               * Quản lý state của modal toàn cục
               * - Tránh prop drilling
               * - Dễ dàng mở/đóng modal từ bất kỳ component nào
               */}
              <ModalProvider>
                {/**
                 * NAVBAR
                 *
                 * Hiển thị trên mọi trang
                 * Chứa: Logo, navigation links, user menu, search, etc.
                 */}
                <Navbar />
                {/**
                 * CHILDREN
                 *
                 * Nội dung trang cụ thể (page.tsx)
                 * Mỗi route sẽ render vào đây
                 */}
                {children}
                {/**
                 * CHAT BOT WIDGET
                 *
                 * Widget chat AI hỗ trợ người dùng
                 * Hiển thị ở góc dưới phải mọi trang
                 */}
                <ChatBotWidget />
              </ModalProvider>
            </AppProviders>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
