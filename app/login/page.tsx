// import { LoginPage } from "@/components/pages/login-page";

// export default function Page() {
//   return <LoginPage />;
// }

"use client";

import Link from "next/link";
import { LoginPage } from "@/components/pages/login-page";
import { useRouter } from "next/navigation";

export default function LoginRoute() {
  const router = useRouter();

  const handleLogin = (email: string, password: string) => {
    // API call logic...
  };

  const handleNavigateToRegister = () => {
    router.push("/register");
  };

  const handleGoogleLogin = () => {
    // Google OAuth logic...
  };

  return (
    <div>
      <LoginPage
        onLogin={handleLogin}
        onNavigateToRegister={handleNavigateToRegister}
        onGoogleLogin={handleGoogleLogin}
      />
    </div>
  );
}
