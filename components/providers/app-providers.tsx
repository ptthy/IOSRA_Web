//components/providers/app-providers.tsx
/*
MỤC ĐÍCH:
Tổng hợp tất cả providers của ứng dụng vào một component duy nhất.
Đây là "root provider" bao bọc toàn bộ ứng dụng.

CHỨC NĂNG CHÍNH:
1. Kết hợp các providers theo đúng thứ tự:
   - AuthProvider (xác thực người dùng)
   - ThemeProvider (dark/light mode)
   - ActiveThemeProvider (theme custom)
2. Khởi tạo Toaster cho thông báo
3. Nhận theme từ server (SSR) để đồng bộ với client

CÁCH HOẠT ĐỘNG:
- Wrap toàn bộ ứng dụng trong providers hierarchy
- Đảm bảo providers bên trong có thể truy cập context của providers bên ngoài
- Xử lý theme synchronization giữa server và client
*/
"use client";
import React from "react";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ActiveThemeProvider } from "@/components/active-theme";
import { Toaster } from "@/components/ui/sonner";
/**
 * Component tổng hợp tất cả providers cho ứng dụng
 * Đây là nơi thiết lập các context/wrapper cho toàn bộ app
 *
 * @param children - Các component con của ứng dụng
 * @param activeThemeValue - Theme khởi tạo từ server (đọc từ cookie)
 */
export function AppProviders({
  children,
  activeThemeValue,
}: {
  children: React.ReactNode;
  activeThemeValue?: string;
}) {
  return (
    /**
     * 1. AuthProvider (ngoài cùng):
     *    - Quản lý trạng thái authentication
     *    - Bao bọc toàn bộ app để mọi nơi đều truy cập được auth state
     */
    <AuthProvider>
      {/**
       * 2. ThemeProvider (next-themes):
       *    - attribute="class": sử dụng class để thay đổi theme
       *    - defaultTheme="system": mặc định dùng theme của hệ thống
       *    - enableSystem: cho phép phát hiện theme hệ thống
       *    - disableTransitionOnChange=true: tắt animation khi đổi theme
       *    - enableColorScheme: hỗ trợ CSS color-scheme property
       */}
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange={true}
        enableColorScheme
      >
        {/**
         * 3. ActiveThemeProvider (custom của app):
         *    - Quản lý theme active tùy chỉnh (khác với dark/light mode)
         *    - initialTheme: nhận giá trị từ server để đồng bộ SSR/CSR
         *    - Lưu vào cookie để duy trì qua các lần reload
         */}
        <ActiveThemeProvider initialTheme={activeThemeValue}>
          {children}
        </ActiveThemeProvider>
      </ThemeProvider>
      {/**
       * 4. Toaster (Sonner toast notifications):
       *    - richColors: hiển thị màu sắc phong phú
       *    - position="top-right": vị trí hiển thị
       *    - Đặt ngoài ThemeProvider để không bị ảnh hưởng bởi theme
       */}
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}
