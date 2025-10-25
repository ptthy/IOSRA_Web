"use client";

import { ResetPasswordPage } from "@/components/pages/reset-password-page";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const handleResetPassword = async (
    otp: string,
    newPassword: string,
    confirmPassword: string
  ) => {
    try {
      // API Call
      const response = await fetch("/api/Auth/forgot-pass/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp,
          newPassword,
          confirmNewPassword: confirmPassword,
        }),
      });

      if (response.ok) {
        // Success! Navigate to login
        router.push("/login?reset=success");
      } else {
        // Handle error
        console.error("Failed to reset password");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleBack = () => {
    router.push("/forgot-password");
  };

  return (
    <ResetPasswordPage
      email={email}
      onResetPassword={handleResetPassword}
      onBack={handleBack}
    />
  );
}

export default function ResetPasswordRoute() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
