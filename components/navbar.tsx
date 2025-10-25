"use client";

import { useTheme } from "next-themes";
import { useRouter, usePathname } from "next/navigation";
import { Moon, Sun, BookOpen, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/verify-otp" ||
    pathname === "/forgot-password" ||
    pathname === "/google-complete";
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  const isActive = (path: string) => pathname === path;

  if (!mounted) {
    return (
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            {/* <BookOpen className="h-6 w-6" style={{ color: "#00416A" }} /> */}
            <span className="font-semibold text-xl">Tora Novel</span>
          </div>
          <div className="h-10 w-10" /> {/* Placeholder for theme button */}
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => handleNavigate("/")}
        >
          {/* <BookOpen className="h-6 w-6" style={{ color: "#00416A" }} /> */}
          <span className="font-semibold text-xl">Tora Novel</span>
          {/* <span
            className="text-xs px-2 py-1 rounded-full"
            style={{ backgroundColor: "#F0EAD6", color: "#00416A" }}
          >
            Beta
          </span> */}
        </div>

        {/* ✅ ĐIỀU KIỆN MỚI: Chỉ hiển thị nav desktop khi KHÔNG phải trang auth */}
        {!isAuthPage && (
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => handleNavigate("/")}
              className={`text-sm transition-colors ${
                isActive("/")
                  ? "font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Trang chủ
            </button>
            <button
              onClick={() => handleNavigate("/library")}
              className={`text-sm transition-colors ${
                isActive("/library")
                  ? "font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Thư viện
            </button>
            <button
              onClick={() => handleNavigate("/discover")}
              className={`text-sm transition-colors ${
                isActive("/discover")
                  ? "font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Khám phá
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full"
          >
            {theme === "light" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>

          {/* Auth Buttons - Desktop */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" onClick={() => handleNavigate("/login")}>
              Đăng nhập
            </Button>
            <Button
              onClick={() => handleNavigate("/register")}
              style={{ backgroundColor: "#00416A", color: "#F0EAD6" }}
              className="hover:opacity-90"
            >
              Đăng ký
            </Button>
          </div>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="flex flex-col gap-4 mt-8">
                {/* ✅ ĐIỀU KIỆN MỚI: Chỉ hiển thị nav mobile khi KHÔNG phải trang auth */}
                {!isAuthPage && (
                  <>
                    <button
                      onClick={() => handleNavigate("/")}
                      className="text-left py-2 text-lg"
                    >
                      Trang chủ
                    </button>
                    <button
                      onClick={() => handleNavigate("/library")}
                      className="text-left py-2 text-lg"
                    >
                      Thư viện
                    </button>
                    <button
                      onClick={() => handleNavigate("/discover")}
                      className="text-left py-2 text-lg"
                    >
                      Khám phá
                    </button>
                  </>
                )}

                {/* Các nút auth này luôn hiển thị trong menu mobile */}
                <div className="border-t pt-4 flex flex-col gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleNavigate("/login")}
                    className="w-full"
                  >
                    Đăng nhập
                  </Button>
                  <Button
                    onClick={() => handleNavigate("/register")}
                    style={{ backgroundColor: "#00416A", color: "#F0EAD6" }}
                    className="w-full"
                  >
                    Đăng ký
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
