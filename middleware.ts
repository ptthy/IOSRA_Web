import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Chỉ xử lý route /author-upgrade
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
          //return NextResponse.redirect(url);
        }
      } catch (error) {
        // Nếu parse cookie lỗi, bỏ qua và cho phép truy cập
        console.error("Error parsing user cookie:", error);
      }
    }
  }

  // Cho phép request tiếp tục
  return NextResponse.next();
}

export const config = {
  matcher: "/author-upgrade",
};
