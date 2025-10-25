"use client";

import { RegisterPage } from "@/components/pages/register-page";

export default function Page() {
  const handleRegister = (
    name: string,
    email: string,
    password: string,
    isAuthor: boolean
  ) => {
    console.log("Đăng ký:", { name, email, password, isAuthor });
  };

  const handleNavigate = (page: string) => {
    console.log("Điều hướng đến:", page);
  };

  return (
    <RegisterPage onRegister={handleRegister} onNavigate={handleNavigate} />
  );
}
