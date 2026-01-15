"use client";

import { useState } from "react";
import StatisticsDashboard from "./components/statistics-page";
import { Roboto } from "next/font/google"; // 1. Import font

// 2. Cấu hình font
const roboto = Roboto({
  subsets: ["latin", "vietnamese"], // Thêm vietnamese để hỗ trợ tiếng Việt tốt nhất
  weight: ["300", "400", "500", "700"], // Các độ đậm cần dùng
});

export default function StatisticsPage() {
  const [currentPage, setCurrentPage] = useState("statistics");

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  return (
    // 3. Áp dụng className của font vào div bao ngoài
    <div className={`flex min-h-screen ${roboto.className}`}>
      {/* Main content */}
      <main className="flex-1 p-6 bg-background">
        <StatisticsDashboard />
      </main>
    </div>
  );
}