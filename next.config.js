/** @type {import('next').NextConfig} */

/**
 * Cấu hình Next.js - File quan trọng nhất cho việc tùy chỉnh Next.js
 * JSDoc comment giúp TypeScript cung cấp type hints
 */
const nextConfig = {
  /**
   * reactStrictMode: Bật chế độ Strict Mode của React
   * false = tắt để tránh double render trong development
   * Giúp debug dễ hơn nhưng có thể bỏ sót potential issues
   */
  reactStrictMode: false,
  /**
   * eslint: Cấu hình tích hợp ESLint
   * ignoreDuringBuilds: true = bỏ qua lỗi ESLint khi build production
   * Cho phép build thành công dù có lỗi ESLint (hữu ích cho CI/CD)
   */
  eslint: {
    ignoreDuringBuilds: true,
  },
  /**
   * typescript: Cấu hình tích hợp TypeScript
   * ignoreBuildErrors: true = bỏ qua lỗi TypeScript khi build
   * Cho phép build production ngay cả khi có lỗi type
   */
  typescript: {
    ignoreBuildErrors: true,
  },
  /**
   * images: Cấu hình tối ưu hình ảnh Next.js
   * remotePatterns: Danh sách domain được phép tối ưu hình ảnh
   * Next.js Image component chỉ optimize hình từ các domain này
   */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com", // Cloudinary - CDN cho hình ảnh
        port: "",
        pathname: "/**", // Tất cả đường dẫn trong domain
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com", // Unsplash - thư viện hình miễn phí
        port: "",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;
