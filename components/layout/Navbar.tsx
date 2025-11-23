// //components/layout/Navbar.tsx

// "use client";

// import React, { useState, useEffect } from "react";
// import { useTheme } from "next-themes";
// import { useRouter, usePathname } from "next/navigation";
// import {
//   Moon,
//   Sun,
//   Menu,
//   User as UserIcon,
//   LogOut,
//   BookOpen,
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// import { useAuth } from "@/context/AuthContext";

// // --- Định nghĩa ImageWithFallback ngay trong file này để tránh lỗi import ---
// const ERROR_IMG_SRC =
//   "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==";

// export function ImageWithFallback(
//   props: React.ImgHTMLAttributes<HTMLImageElement>
// ) {
//   const [didError, setDidError] = useState(false);
//   const handleError = () => setDidError(true);
//   const { src, alt, style, className, ...rest } = props;

//   return didError ? (
//     <div
//       className={`inline-block bg-gray-100 text-center align-middle ${
//         className ?? ""
//       }`}
//       style={style}
//     >
//       <div className="flex items-center justify-center w-full h-full">
//         <img src={ERROR_IMG_SRC} alt="Error" {...rest} />
//       </div>
//     </div>
//   ) : (
//     <img
//       src={src}
//       alt={alt}
//       className={className}
//       style={style}
//       {...rest}
//       onError={handleError}
//     />
//   );
// }
// // ---------------------------------------------------------------------------

// export function Navbar() {
//   const { theme, setTheme } = useTheme();
//   const router = useRouter();
//   const pathname = usePathname();
//   const [mounted, setMounted] = useState(false);
//   const [open, setOpen] = useState(false);

//   // ✅ LẤY isAuthor TỪ AUTHCONTEXT (Đã bao gồm logic check Approved Status)
//   const { user, isAuthenticated, logout, isAuthor } = useAuth();

//   const isAuthPage =
//     pathname === "/login" ||
//     pathname === "/register" ||
//     pathname === "/verify-otp" ||
//     pathname === "/forgot-password" ||
//     pathname === "/google-complete";

//   useEffect(() => {
//     setMounted(true);
//   }, []);

//   const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");
//   const handleNavigate = (path: string) => router.push(path);
//   const isActive = (path: string) => pathname === path;

//   const getInitials = (name: string) => {
//     if (!name) return "??";
//     return name
//       .split(" ")
//       .map((n) => n[0])
//       .join("")
//       .toUpperCase()
//       .slice(0, 2);
//   };

//   const handleLogout = () => {
//     logout();
//     router.push("/");
//   };

//   if (!mounted) {
//     return (
//       <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
//         <div className="container flex h-16 items-center justify-between px-4">
//           <div className="flex items-center gap-2">
//             <BookOpen className="h-6 w-6 text-primary" />
//             <span className="font-semibold text-xl">Tora Novel</span>
//           </div>
//         </div>
//       </nav>
//     );
//   }

//   return (
//     <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
//       <div className="container flex h-16 items-center justify-between px-4">
//         <div
//           className="flex items-center gap-2 cursor-pointer"
//           onClick={() => handleNavigate("/")}
//         >
//           <BookOpen className="h-6 w-6 text-primary" />
//           <span className="font-semibold text-xl">Tora Novel</span>
//         </div>

//         {/* Desktop Navigation */}
//         {!isAuthPage && (
//           <div className="hidden md:flex items-center gap-6">
//             <button
//               onClick={() => handleNavigate("/")}
//               className={`text-sm transition-colors ${
//                 isActive("/")
//                   ? "font-medium"
//                   : "text-muted-foreground hover:text-foreground"
//               }`}
//             >
//               Trang chủ
//             </button>
//             <button
//               onClick={() => handleNavigate("/search")}
//               className={`text-sm transition-colors ${
//                 isActive("/search")
//                   ? "font-medium"
//                   : "text-muted-foreground hover:text-foreground"
//               }`}
//             >
//               Tìm kiếm
//             </button>
//             <button
//               onClick={() => handleNavigate("/profile")}
//               className={`text-sm transition-colors ${
//                 isActive("/profile")
//                   ? "font-medium"
//                   : "text-muted-foreground hover:text-foreground"
//               }`}
//             >
//               Profile
//             </button>
//             <button
//               onClick={() => handleNavigate("/author-upgrade")}
//               className={`text-sm transition-colors ${
//                 isActive("/author-upgrade")
//                   ? "font-medium"
//                   : "text-muted-foreground hover:text-foreground"
//               }`}
//             >
//               Sáng tác
//             </button>
//           </div>
//         )}

//         {/* Actions */}
//         <div className="flex items-center gap-2">
//           <Button
//             variant="ghost"
//             size="icon"
//             onClick={toggleTheme}
//             className="rounded-full"
//           >
//             {theme === "light" ? (
//               <Moon className="h-5 w-5" />
//             ) : (
//               <Sun className="h-5 w-5" />
//             )}
//           </Button>

//           {!isAuthPage && (
//             <div className="hidden md:flex items-center gap-3">
//               {isAuthenticated && user ? (
//                 <DropdownMenu open={open} onOpenChange={setOpen}>
//                   <DropdownMenuTrigger asChild>
//                     <Button
//                       variant="ghost"
//                       className="relative h-10 w-10 rounded-full"
//                       onClick={() => setOpen(true)}
//                     >
//                       <Avatar className="h-10 w-10">
//                         <AvatarImage
//                           asChild
//                           src={user?.avatar}
//                           alt={user?.displayName || "User"}
//                         >
//                           <ImageWithFallback
//                             src={user?.avatar}
//                             alt={user?.displayName || "User"}
//                           />
//                         </AvatarImage>
//                         <AvatarFallback className="bg-secondary text-secondary-foreground">
//                           {getInitials(
//                             user?.displayName || user?.username || ""
//                           )}
//                         </AvatarFallback>
//                       </Avatar>
//                     </Button>
//                   </DropdownMenuTrigger>
//                   <DropdownMenuContent
//                     align="end"
//                     className="w-56 mt-2"
//                     forceMount
//                   >
//                     <div className="flex items-center gap-3 p-3">
//                       <Avatar className="h-10 w-10">
//                         <AvatarImage
//                           asChild
//                           src={user?.avatar}
//                           alt={user?.displayName || "User"}
//                         >
//                           <ImageWithFallback
//                             src={user?.avatar}
//                             alt={user?.displayName || "User"}
//                           />
//                         </AvatarImage>
//                         <AvatarFallback className="bg-secondary text-secondary-foreground">
//                           {getInitials(
//                             user?.displayName || user?.username || ""
//                           )}
//                         </AvatarFallback>
//                       </Avatar>
//                       <div className="flex flex-col space-y-1 overflow-hidden">
//                         <p className="text-sm font-medium leading-none truncate">
//                           {user?.displayName || user?.username}
//                         </p>
//                         <p className="text-xs text-muted-foreground truncate">
//                           {user?.email}
//                         </p>
//                       </div>
//                     </div>
//                     <DropdownMenuSeparator />
//                     <DropdownMenuItem
//                       onClick={() => handleNavigate("/profile")}
//                       className="cursor-pointer"
//                     >
//                       <UserIcon className="mr-2 h-4 w-4" /> <span>Hồ sơ</span>
//                     </DropdownMenuItem>
//                     <DropdownMenuSeparator />
//                     <DropdownMenuItem
//                       onClick={handleLogout}
//                       className="cursor-pointer text-red-600 focus:text-red-600"
//                     >
//                       <LogOut className="mr-2 h-4 w-4" /> <span>Đăng xuất</span>
//                     </DropdownMenuItem>
//                   </DropdownMenuContent>
//                 </DropdownMenu>
//               ) : (
//                 <>
//                   <Button
//                     variant="ghost"
//                     onClick={() => handleNavigate("/login")}
//                   >
//                     Đăng nhập
//                   </Button>
//                   <Button
//                     onClick={() => handleNavigate("/register")}
//                     className="bg-primary text-primary-foreground hover:bg-primary/90"
//                   >
//                     Đăng ký
//                   </Button>
//                 </>
//               )}
//             </div>
//           )}

//           {/* Mobile Menu */}
//           <Sheet>
//             <SheetTrigger asChild className="md:hidden">
//               <Button variant="ghost" size="icon">
//                 <Menu className="h-5 w-5" />
//               </Button>
//             </SheetTrigger>
//             <SheetContent>
//               <div className="flex flex-col gap-4 mt-8">
//                 {isAuthenticated && user && (
//                   <div className="flex items-center gap-3 pb-4 border-b">
//                     <Avatar className="h-12 w-12">
//                       <AvatarImage
//                         asChild
//                         src={user?.avatar}
//                         alt={user?.displayName || "User"}
//                       >
//                         <ImageWithFallback
//                           src={user?.avatar}
//                           alt={user?.displayName || "User"}
//                         />
//                       </AvatarImage>
//                       <AvatarFallback className="bg-primary text-primary-foreground">
//                         {getInitials(user?.displayName || user?.username || "")}
//                       </AvatarFallback>
//                     </Avatar>
//                     <div className="flex flex-col overflow-hidden">
//                       <p className="text-sm font-medium truncate">
//                         {user.displayName || user.username}
//                       </p>
//                       <p className="text-xs text-muted-foreground truncate">
//                         {user.email}
//                       </p>
//                     </div>
//                   </div>
//                 )}

//                 {!isAuthPage && (
//                   <>
//                     <button
//                       onClick={() => handleNavigate("/")}
//                       className="text-left py-2 text-lg"
//                     >
//                       Trang chủ
//                     </button>
//                     <button
//                       onClick={() => handleNavigate("/search")}
//                       className="text-left py-2 text-lg"
//                     >
//                       Tìm kiếm
//                     </button>
//                     <button
//                       onClick={() => handleNavigate("/profile")}
//                       className="text-left py-2 text-lg"
//                     >
//                       Profile
//                     </button>
//                     <button
//                       onClick={() => handleNavigate("/author-upgrade")}
//                       className="text-left py-2 text-lg"
//                     >
//                       Sáng tác
//                     </button>
//                   </>
//                 )}

//                 <div className="border-t pt-4 flex flex-col gap-2">
//                   {isAuthenticated && user ? (
//                     <>
//                       <Button
//                         variant="outline"
//                         onClick={() => handleNavigate("/profile")}
//                         className="w-full justify-start"
//                       >
//                         <UserIcon className="mr-2 h-4 w-4" /> Hồ sơ
//                       </Button>
//                       <Button
//                         variant="outline"
//                         onClick={handleLogout}
//                         className="w-full justify-start"
//                       >
//                         <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
//                       </Button>
//                     </>
//                   ) : (
//                     <>
//                       <Button
//                         variant="outline"
//                         onClick={() => handleNavigate("/login")}
//                         className="w-full"
//                       >
//                         Đăng nhập
//                       </Button>
//                       <Button
//                         onClick={() => handleNavigate("/register")}
//                         className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
//                       >
//                         Đăng ký
//                       </Button>
//                     </>
//                   )}
//                 </div>
//               </div>
//             </SheetContent>
//           </Sheet>
//         </div>
//       </div>
//     </nav>
//   );
// }
//components/layout/Navbar.tsx

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
} from "lucide-react";
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

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  // ✅ LẤY isAuthor TỪ AUTHCONTEXT (Đã bao gồm logic check Approved Status)
  const { user, isAuthenticated, logout, isAuthor } = useAuth();

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/verify-otp" ||
    pathname === "/forgot-password" ||
    pathname === "/google-complete";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (pathname && pathname.startsWith("/Op")) {
    return null;
  }
  if (pathname && pathname.startsWith("/Content")) {
    return null;
  }

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");
  const handleNavigate = (path: string) => router.push(path);
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

  if (!mounted) {
    return (
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="font-semibold text-xl">Tora Novel</span>
          </div>
        </div>
      </nav>
    );
  }

  // 🛠 FIX: Render avatar đơn giản không cần hàm phức tạp
  const renderAvatar = (size = 10) => (
    <Avatar className={`h-${size} w-${size}`}>
      {user?.avatar ? (
        <AvatarImage
          src={user.avatar}
          alt={user?.displayName || user?.username || "User"}
          className="h-full w-full object-cover"
        />
      ) : (
        <AvatarFallback className="bg-secondary text-secondary-foreground">
          {getInitials(user?.displayName || user?.username || "")}
        </AvatarFallback>
      )}
    </Avatar>
  );

  return (
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
              onClick={() => handleNavigate("/profile")}
              className={`text-sm transition-colors ${
                isActive("/profile")
                  ? "font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => handleNavigate("/author-upgrade")}
              className={`text-sm transition-colors ${
                isActive("/author-upgrade")
                  ? "font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sáng tác
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
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
                      <LogOut className="mr-2 h-4 w-4" /> <span>Đăng xuất</span>
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
                    <div className="flex flex-col overflow-hidden">
                      <p className="text-sm font-medium truncate">
                        {user.displayName || user.username}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
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
                      onClick={() => handleNavigate("/profile")}
                      className="text-left py-2 text-lg"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => handleNavigate("/author-upgrade")}
                      className="text-left py-2 text-lg"
                    >
                      Sáng tác
                    </button>
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
  );
}
