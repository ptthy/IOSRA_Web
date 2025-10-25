"use client";

import { ForgotPasswordPage } from "@/components/pages/forgot-password-page";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ForgotPasswordRoute() {
  const router = useRouter();

  const handleSendOTP = async (email: string) => {
    try {
      // API Call
      const response = await fetch("/api/Auth/forgot-pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        // Navigate to reset password page with email
        router.push(`/reset-password?email=${encodeURIComponent(email)}`);
      } else {
        // Handle error
        console.error("Failed to send OTP");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleBack = () => {
    router.push("/login");
  };

  return <ForgotPasswordPage onSendOTP={handleSendOTP} onBack={handleBack} />;
}
