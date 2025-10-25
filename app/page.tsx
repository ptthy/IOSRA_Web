"use client";

import { HomePage } from "@/components/pages/home-page";

export default function Page() {
  const handleNavigate = (page: string) => {
    // Điều hướng tạm thời (sau này có thể dùng router.push)
    alert(`Đi đến trang: ${page}`);
  };

  return <HomePage onNavigate={handleNavigate} isLoggedIn={false} />;
}
