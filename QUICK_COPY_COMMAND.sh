#!/bin/bash
TARGET_DIR="."


mkdir -p "./components/pages"

# 1?? Home Page
cat > "./components/pages/home-page.tsx" << 'HOME'
"use client";

export function HomePage() {
  return (
    <div className="text-center p-10 text-2xl font-semibold">
      ?? Welcome to IOSRA Home Page
    </div>
  );
}
HOME

# 2?? Login Page
cat > "./components/pages/login-page.tsx" << 'LOGIN'
"use client";

export function LoginPage() {
  return (
    <div className="text-center p-10 text-2xl font-semibold">
      ?? Login Page
    </div>
  );
}
LOGIN

# 3?? Register Page
cat > "./components/pages/register-page.tsx" << 'REGISTER'
"use client";

export function RegisterPage() {
  return (
    <div className="text-center p-10 text-2xl font-semibold">
      ?? Register Page
    </div>
  );
}
REGISTER

# 4?? OTP Page
cat > "./components/pages/otp-verification-page.tsx" << 'OTP'
"use client";

export function OTPVerificationPage() {
  return (
    <div className="text-center p-10 text-2xl font-semibold">
      ?? OTP Verification Page
    </div>
  );
}
OTP

echo "? All page components created in components/pages/"
