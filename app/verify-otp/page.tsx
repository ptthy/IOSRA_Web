"use client";

import { OTPVerificationPage } from "@/components/pages/otp-verification-page";

export default function Page() {
  const handleVerify = (otp: string) => {
    console.log("Đã xác thực OTP:", otp);
  };

  const handleResend = () => {
    console.log("Đã gửi lại mã OTP");
  };

  const handleBack = () => {
    console.log("Quay lại trang đăng ký");
  };

  return (
    <OTPVerificationPage
      email="example@gmail.com"
      onVerify={handleVerify}
      onResend={handleResend}
      onBack={handleBack}
    />
  );
}
