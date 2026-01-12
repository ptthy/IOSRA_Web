//components/providers/theme-provider.tsx
/*
MỤC ĐÍCH:
Wrapper component cho thư viện next-themes.
Quản lý dark/light mode cơ bản của ứng dụng.

CHỨC NĂNG CHÍNH:
1. Cung cấp theme switching giữa light/dark/system
2. Tự động phát hiện system preference
3. Ngăn chặn flicker khi render trên server (SSR)
4. Lưu preference vào localStorage

CÁCH HOẠT ĐỘNG:
- Sử dụng thư viện next-themes để xử lý theme switching
- Thêm/remove class "dark" trên <html> element
- Đồng bộ theme giữa các tabs/windows
*/
"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
/**
 * Wrapper component cho next-themes library
 *
 * Mục đích:
 * 1. Đánh dấu component là Client Component ("use client")
 * 2. Bao bọc next-themes provider để dễ quản lý
 * 3. Cung cấp type safety cho props
 * 4. Tạo abstraction layer để dễ thay đổi/thử nghiệm library khác
 *
 * @param props - Tất cả props của NextThemesProvider
 * @returns NextThemesProvider với children
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  /**
   * Sử dụng NextThemesProvider từ next-themes:
   * - Hỗ trợ dark/light mode
   * - Tự động phát hiện system preference
   * - Chống flicker trên SSR
   * - Lưu preference vào localStorage
   * - Cập nhật thuộc tính "data-theme" hoặc class trên <html>
   */
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
