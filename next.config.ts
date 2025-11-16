// next.config.ts

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Bỏ qua ESLint trong build nếu cần

    ignoreDuringBuilds: true,
  },

  typescript: {
    // Bỏ qua TypeScript errors trong build nếu cần

    ignoreBuildErrors: true,
  },

  images: {
    domains: [
      "encrypted-tbn0.gstatic.com",

      "images.unsplash.com",

      "plus.unsplash.com",
    ],
  },
};

export default nextConfig;
