/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... (các config khác của bạn có thể đã ở đây)

  // ✅ THÊM ĐOẠN NÀY VÀO:
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**', // Cho phép mọi đường dẫn con
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // Thêm cả domain dự phòng
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;