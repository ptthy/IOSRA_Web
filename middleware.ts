import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Xử lý route /author-upgrade
  if (pathname === "/author-upgrade") {
    // Đọc cookie chứa thông tin user
    const userCookie = request.cookies.get("authUser");

    if (userCookie) {
      try {
        const user = JSON.parse(userCookie.value);

        // Kiểm tra nếu user đã là author
        const isAlreadyAuthor =
          user.roles?.includes("author") || user.isAuthorApproved;

        if (isAlreadyAuthor) {
          // Redirect về trang author overview
          const url = request.nextUrl.clone();
          url.pathname = "/author/overview";
          return NextResponse.redirect(url);
        }
      } catch (error) {
        // Nếu parse cookie lỗi, bỏ qua và cho phép truy cập
        console.error("Error parsing user cookie:", error);
      }
    }
  }

  // Xử lý tất cả routes /author/* (trừ /author-upgrade)
  if (pathname.startsWith("/author/") && pathname !== "/author-upgrade") {
    const userCookie = request.cookies.get("authUser");

    if (userCookie) {
      try {
        const user = JSON.parse(userCookie.value);

        // Kiểm tra nếu user KHÔNG phải author
        const isAuthor =
          user.roles?.includes("author") || user.isAuthorApproved;

        // Cho phép vào trang để client-side có thể refresh token
        // Client-side sẽ kiểm tra lại và redirect nếu cần
        // Chỉ redirect nếu chắc chắn không phải author (để tránh chặn refresh token)
        if (!isAuthor) {
          // Cho phép vào trang, client-side sẽ refresh token và kiểm tra lại
          // Nếu sau khi refresh vẫn không phải author, client sẽ redirect
          return NextResponse.next();
        }
      } catch (error) {
        // Nếu parse cookie lỗi, redirect về login
        console.error("Error parsing user cookie:", error);
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
      }
    } else {
      // Không có cookie -> chưa login, redirect về login
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  // Cho phép request tiếp tục
  return NextResponse.next();
}

export const config = {
  matcher: ["/author-upgrade", "/author/:path*"],
};
