import type { Config } from "tailwindcss";

/**
 * Import plugin tailwindcss-animate để thêm animation utilities
 * Plugin này được sử dụng bởi shadcn/ui để cung cấp animation classes
 */
const tailwindcssAnimate = require("tailwindcss-animate");
/**
 * Cấu hình chính của Tailwind CSS
 * TypeScript type: Config đảm bảo cấu hình đúng định dạng
 */
const config: Config = {
  /**
   * content: Định nghĩa các file cần được scan class Tailwind
   * Tailwind sẽ tìm class trong các file này để tạo CSS
   * Cấu hình cho cấu trúc dự án Next.js App Router
   */
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}", // File trong thư mục pages
    "./components/**/*.{js,ts,jsx,tsx,mdx}", // File trong thư mục components
    "./app/**/*.{js,ts,jsx,tsx,mdx}", // File trong thư mục app (App Router)
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // File trong thư mục src (nếu có)
  ],
  plugins: [
    /**
     * plugins: Các plugin mở rộng tính năng Tailwind
     * tailwindcssAnimate: Thêm các utility class cho animation
     * - animate-in: animation khi element xuất hiện
     * - animate-out: animation khi element biến mất
     * - fade-in-*, slide-in-*: Các hiệu ứng cụ thể
     */
    tailwindcssAnimate, // Plugin của shadcn
  ],
};

export default config;
