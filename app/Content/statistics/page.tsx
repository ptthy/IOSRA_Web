"use client";

import { useState } from "react";
import StatisticsDashboard from "./components/statistics-page";

export default function StatisticsPage() {
  const [currentPage, setCurrentPage] = useState("statistics");

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  return (
    <div className="flex min-h-screen font-[Poppins]">
     

      {/* Main content */}
      <main className="flex-1 p-6 bg-background">
        <StatisticsDashboard />
      </main>
    </div>
  );
}
