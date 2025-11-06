// components/ProtectedAuthorRoute.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface ProtectedAuthorRouteProps {
  children: React.ReactNode;
}

export default function ProtectedAuthorRoute({
  children,
}: ProtectedAuthorRouteProps) {
  const { user, isAuthor, isLoading } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Chỉ xử lý redirect khi đã load xong auth và không đang redirect
    if (!isLoading && !isRedirecting) {
      if (!user) {
        // Nếu chưa login, redirect đến login
        setIsRedirecting(true);
        router.push("/login");
      } else if (!isAuthor) {
        // Nếu đã login nhưng không phải author, redirect đến trang nâng cấp
        setIsRedirecting(true);
        router.push("/author-upgrade");
      }
    }
  }, [user, isAuthor, isLoading, isRedirecting, router]);

  // Hiển thị loading khi đang xác thực
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Đang xác thực...</span>
      </div>
    );
  }

  // Hiển thị loading khi đang chuyển hướng
  if (isRedirecting) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Đang chuyển hướng...</span>
      </div>
    );
  }

  // Nếu không có user hoặc không phải author, không render children
  // (thực tế sẽ không đến được đây vì đã redirect)
  if (!user || !isAuthor) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Đang xử lý...</span>
      </div>
    );
  }

  // Render children khi đã xác thực là author
  return <>{children}</>;
}
