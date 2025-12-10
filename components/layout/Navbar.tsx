// components/layout/Navbar.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useRouter, usePathname } from "next/navigation";
import {
  Moon,
  Sun,
  Menu,
  User as UserIcon,
  LogOut,
  BookOpen,
  Gem,
  Gift,
  Loader2,
  PenLine,
} from "lucide-react";
import { toast } from "sonner";
import { subscriptionService } from "@/services/subscriptionService";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import { useAuth } from "@/context/AuthContext";
import { profileService } from "@/services/profileService";
import { TopUpModal } from "@/components/payment/TopUpModal";
import { NotificationDropdown } from "@/components/notification/NotificationDropdown";
import { NotificationTicker } from "@/components/notification/NotificationTicker";
export function Navbar() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  // --- STATE VÍ & MODAL ---
  const [diaBalance, setDiaBalance] = useState(0);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [serverAvatar, setServerAvatar] = useState<string | null>(null);
  // --- STATE NHẬN QUÀ ---
  const [claimInfo, setClaimInfo] = useState({
    canClaim: false,
    amount: 0,
  });
  const [isClaiming, setIsClaiming] = useState(false);

  const { user, isAuthenticated, logout } = useAuth();
  const isAuthor =
    user?.roles?.includes("author") || (user as any)?.isAuthorApproved;
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/verify-otp" ||
    pathname === "/forgot-password" ||
    pathname === "/google-complete";

  // Fix hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Hàm lấy số dư
  const fetchWallet = async () => {
    try {
      const res = await profileService.getWallet();
      if (res.data) {
        setDiaBalance(res.data.diaBalance || 0);
      }
    } catch (error) {
      console.error("Lỗi lấy số dư ví", error);
    }
  };

  // Hàm kiểm tra trạng thái nhận quà
  const checkClaimStatus = async () => {
    try {
      const res = await subscriptionService.getStatus();
      setClaimInfo({
        canClaim: res.data.canClaimToday,
        amount: res.data.dailyDias,
      });
    } catch (error) {
      console.error("Lỗi check daily claim navbar", error);
    }
  };
  // --- THÊM HÀM LẤY PROFILE ĐỂ LẤY AVATAR ---
  // const fetchProfileData = async () => {
  //   try {
  //     const res = await profileService.getProfile();
  //     if (res.data) {
  //       // Lấy đúng field "avatarUrl" từ JSON response
  //       setServerAvatar(res.data.avatarUrl);
  //     }
  //   } catch (error) {
  //     console.error("Lỗi lấy thông tin profile navbar", error);
  //   }
  // };
  const fetchProfileData = async () => {
    try {
      const res = await profileService.getProfile();
      if (res.data) {
        setServerAvatar(res.data.avatarUrl);
      }
    } catch (error: any) {
      // Nếu user (như mod) không có profile (Lỗi 404) -> Bỏ qua, không báo lỗi
      if (error?.response?.status === 404) return;

      console.warn("Lỗi khác:", error?.message);
    }
  };
  // ------------------------------------------

  // --- EFFECT LẮNG NGHE SỰ KIỆN & LOAD DỮ LIỆU ---
  useEffect(() => {
    const handleWalletUpdate = () => {
      if (isAuthenticated) {
        fetchWallet();
        checkClaimStatus();
        fetchProfileData();
      }
    };

    // Gọi lần đầu khi component mount hoặc auth thay đổi
    if (isAuthenticated) {
      fetchWallet();
      checkClaimStatus();
      fetchProfileData();
    }

    // Đăng ký sự kiện cập nhật ví từ nơi khác (ví dụ: trang Profile)
    window.addEventListener("wallet-updated", handleWalletUpdate);

    // Cleanup
    return () => {
      window.removeEventListener("wallet-updated", handleWalletUpdate);
    };
  }, [isAuthenticated, pathname]);

  // --- HÀM XỬ LÝ NHẬN QUÀ ---
  const handleQuickClaim = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isClaiming) return;
    setIsClaiming(true);

    try {
      const res = await subscriptionService.claimDaily();
      const data = res.data;

      toast.success(`Đã nhận ${data.claimedDias} Kim cương!`);

      // Cập nhật UI cục bộ ngay lập tức
      setDiaBalance(data.walletBalance);
      setClaimInfo((prev) => ({ ...prev, canClaim: false }));

      // Bắn sự kiện để các component khác cùng cập nhật
      window.dispatchEvent(new Event("wallet-updated"));
    } catch (error) {
      toast.error("Lỗi nhận quà hoặc gói đã hết hạn.");
    } finally {
      setIsClaiming(false);
    }
  };
  // --- HÀM MỚI: XỬ LÝ CHUYỂN HƯỚNG TÁC GIẢ ---
  const handleAuthorClick = () => {
    // Check quyền ngay lúc bấm, không render điều kiện gây lag
    if (isAuthor) {
      router.push("/author/overview");
    } else {
      router.push("/author-upgrade");
    }
    setOpen(false); // Đóng menu (dropdown/mobile) sau khi bấm
  };
  // Ẩn Navbar ở các trang đọc truyện
  if (
    (pathname &&
      (pathname.startsWith("/Op") || pathname.startsWith("/Content"))) ||
    pathname.startsWith("/Admin")
  ) {
    return null;
  }

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");
  const handleNavigate = (path: string) => router.push(path);

  // -----------------------------

  const isActive = (path: string) => pathname === path;

  const getInitials = (name: string) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // const renderAvatar = (size = 10) => (
  //   <Avatar className={`h-${size} w-${size}`}>
  //     {user?.avatar ? (
  //       <AvatarImage
  //         src={user.avatar}
  //         alt={user?.displayName || user?.username || "User"}
  //         className="h-full w-full object-cover"
  //       />
  //     ) : (
  //       <AvatarFallback className="bg-secondary text-secondary-foreground">
  //         {getInitials(user?.displayName || user?.username || "")}
  //       </AvatarFallback>
  //     )}
  //   </Avatar>
  // );
  const renderAvatar = (size = 10) => {
    // Ưu tiên lấy serverAvatar (từ API) -> sau đó mới tới user.avatar (từ Context)
    const displayAvatar = serverAvatar || user?.avatar;
    const displayName = user?.displayName || user?.username || "";

    return (
      <Avatar className={`h-${size} w-${size}`}>
        {displayAvatar ? (
          <AvatarImage
            src={displayAvatar}
            alt={displayName}
            className="h-full w-full object-cover"
          />
        ) : (
          <AvatarFallback className="bg-secondary text-secondary-foreground">
            {getInitials(displayName)}
          </AvatarFallback>
        )}
      </Avatar>
    );
  };

  if (!mounted) return null;

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => handleNavigate("/")}
          >
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="font-semibold text-xl">Tora Novel</span>
          </div>

          {/* Desktop Navigation */}
          {!isAuthPage && (
            <div className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
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
                onClick={() => handleNavigate("/search")}
                className={`text-sm transition-colors ${
                  isActive("/search")
                    ? "font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Tìm kiếm
              </button>
              <button
                onClick={() => handleNavigate("/author-upgrade")}
                className={`text-sm transition-colors ${
                  isActive("/author-upgrade")
                    ? "font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Góc tác giả
              </button>

              {/* <button
                onClick={() => handleNavigate("/author/overview")}
                className={`text-sm transition-colors ${
                  isActive("/author/overview")
                    ? "font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Góc sáng tác
              </button> */}
            </div>
          )}

          {/* Actions Right Side */}
          <div className="flex items-center gap-2">
            {isAuthenticated && !isAuthPage && (
              <div className="hidden xl:flex absolute right-[170px] top-1/2 -translate-y-1/2 w-[220px] justify-end">
                <NotificationTicker />
              </div>
            )}
            {/* Desktop Top Up Button */}
            {isAuthenticated && !isAuthPage && (
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex items-center gap-2 rounded-full border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 mr-2"
                onClick={() => setIsTopUpOpen(true)}
              >
                <Gem className="h-4 w-4 fill-yellow-500 text-yellow-600" />
                <span className="font-bold">{diaBalance.toLocaleString()}</span>
              </Button>
            )}

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

            {!isAuthPage && (
              <div className="hidden md:flex items-center gap-3">
                {isAuthenticated && user ? (
                  <DropdownMenu open={open} onOpenChange={setOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="relative h-10 w-10 rounded-full p-0"
                      >
                        {renderAvatar(10)}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-56 mt-2"
                      forceMount
                    >
                      <div className="flex items-center gap-3 p-3">
                        {renderAvatar(10)}
                        <div className="flex flex-col space-y-1 overflow-hidden">
                          <p className="text-sm font-medium leading-none truncate">
                            {user?.displayName || user?.username}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user?.email}
                          </p>
                        </div>
                      </div>

                      {/* --- NÚT NHẬN QUÀ TRONG DROPDOWN (DESKTOP) --- */}
                      {claimInfo.canClaim && (
                        <div className="px-2 py-1">
                          <Button
                            size="sm"
                            className="w-full justify-start bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white border-0 shadow-sm animate-pulse"
                            onClick={handleQuickClaim}
                            disabled={isClaiming}
                          >
                            {isClaiming ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Gift className="mr-2 h-4 w-4 animate-bounce" />
                            )}
                            {isClaiming
                              ? "Đang nhận..."
                              : `Nhận ${claimInfo.amount} KC`}
                          </Button>
                        </div>
                      )}

                      {/* Hiển thị số dư cho thiết bị nhỏ (nếu Dropdown hiện trên mobile) */}
                      <div className="px-3 py-2 bg-muted/50 rounded-md mb-2 mx-2 flex justify-between items-center md:hidden">
                        <span className="text-xs font-medium">Số dư:</span>
                        <span className="text-sm font-bold text-yellow-600 flex items-center gap-1">
                          <Gem className="h-3 w-3" /> {diaBalance}
                        </span>
                      </div>

                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleNavigate("/profile")}
                        className="cursor-pointer"
                      >
                        <UserIcon className="mr-2 h-4 w-4" /> <span>Hồ sơ</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="cursor-pointer text-red-600 focus:text-red-600"
                      >
                        <LogOut className="mr-2 h-4 w-4" />{" "}
                        <span>Đăng xuất</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => handleNavigate("/login")}
                    >
                      Đăng nhập
                    </Button>
                    <Button
                      onClick={() => handleNavigate("/register")}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Đăng ký
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col gap-4 mt-8">
                  {isAuthenticated && user && (
                    <div className="flex items-center gap-3 pb-4 border-b">
                      {renderAvatar(12)}
                      <div className="flex flex-col overflow-hidden w-full">
                        <p className="text-sm font-medium truncate">
                          {user.displayName || user.username}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>

                        {/* --- KHU VỰC SỐ DƯ & NHẬN QUÀ (MOBILE) --- */}
                        <div className="mt-3 flex flex-col items-start gap-2 w-full">
                          {/* 1. Nút hiển thị số dư (Nằm riêng) */}
                          <div
                            className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1.5 rounded-full w-fit cursor-pointer"
                            onClick={() => setIsTopUpOpen(true)}
                          >
                            <Gem className="h-3 w-3 text-yellow-600" />
                            <span className="text-xs font-bold text-yellow-700 dark:text-yellow-400">
                              {diaBalance.toLocaleString()} Dias
                            </span>
                          </div>

                          {/* 2. Nút nhận quà (Nằm riêng bên dưới, KHÔNG lồng vào div trên) */}
                          {claimInfo.canClaim && (
                            <Button
                              size="sm"
                              className="w-full h-8 bg-yellow-500 hover:bg-yellow-600 text-white text-xs mt-1"
                              onClick={handleQuickClaim}
                              disabled={isClaiming}
                            >
                              {isClaiming ? (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              ) : (
                                <Gift className="mr-1 h-3 w-3" />
                              )}
                              Nhận {claimInfo.amount} KC ngay
                            </Button>
                          )}
                        </div>
                        {/* ------------------------------------------- */}
                      </div>
                    </div>
                  )}

                  {!isAuthPage && (
                    <>
                      <button
                        onClick={() => handleNavigate("/")}
                        className="text-left py-2 text-lg"
                      >
                        Trang chủ
                      </button>
                      <button
                        onClick={() => handleNavigate("/search")}
                        className="text-left py-2 text-lg"
                      >
                        Tìm kiếm
                      </button>
                      <button
                        onClick={() => handleNavigate("/author-upgrade")}
                        className="text-left py-2 text-lg"
                      >
                        Góc tác giả
                      </button>

                      {/* Luôn hiện nút Góc sáng tác */}
                      {/* <button
                        onClick={() => {
                          handleNavigate("/author/overview");
                          // setOpen(false);
                        }}
                        className="text-left py-2 text-lg"
                      >
                        Góc sáng tác
                      </button> */}
                    </>
                  )}

                  <div className="border-t pt-4 flex flex-col gap-2">
                    {isAuthenticated && user ? (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => handleNavigate("/profile")}
                          className="w-full justify-start"
                        >
                          <UserIcon className="mr-2 h-4 w-4" /> Hồ sơ
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleLogout}
                          className="w-full justify-start"
                        >
                          <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => handleNavigate("/login")}
                          className="w-full"
                        >
                          Đăng nhập
                        </Button>
                        <Button
                          onClick={() => handleNavigate("/register")}
                          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          Đăng ký
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      <TopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        currentBalance={diaBalance}
      />
    </>
  );
}
