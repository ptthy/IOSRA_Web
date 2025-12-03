/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, //  Đổi từ true (hoặc mặc định) thành false
  // ... các config khác

  // ✅ THÊM ĐOẠN NÀY VÀO:
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**", // Cho phép mọi đường dẫn con
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com", // Thêm cả domain dự phòng
        port: "",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;
