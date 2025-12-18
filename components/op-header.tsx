"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function OpHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    // toast.success("Đã đăng xuất");
    router.push("/login");
  };

  return (
    <header className="flex items-center justify-between w-full bg-card border-b p-4 shadow-sm">
      {/* Bên trái: Tiêu đề hoặc tên trang */}
      <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>

      {/* Bên phải: avatar + tên user + nút logout */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8">
            <AvatarImage
              src={user?.avatar || "/avatar.png"}
              alt={user?.displayName || user?.username || "User"}
            />
            <AvatarFallback>
              {user?.displayName?.charAt(0)?.toUpperCase() ||
                user?.username?.charAt(0)?.toUpperCase() ||
                "U"}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-sm">
            {user?.displayName || user?.username || "Người dùng"}
          </span>
        </div>

        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="w-5 h-5 text-destructive" />
        </Button>
      </div>
    </header>
  );
}
