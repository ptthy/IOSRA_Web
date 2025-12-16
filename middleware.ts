import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
// [Bổ sung 1]: Thêm cấu hình đường dẫn cho Staff để dễ quản lý
const STAFF_CONFIG: Record<string, { dashboard: string; allowedBase: string }> =
  {
    admin: {
      dashboard: "/Admin",
      allowedBase: "/Admin",
    },
    omod: {
      dashboard: "/Op/dashboard",
      allowedBase: "/Op",
    },
    cmod: {
      dashboard: "/Content/dashboard",
      allowedBase: "/Content",
    },
  };
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userCookie = request.cookies.get("authUser");
  // [Bổ sung 2]: Thêm logic kiểm tra Role Staff ngay đầu hàm
  if (userCookie) {
    try {
      const user = JSON.parse(userCookie.value);
      const roles = user.roles || [];

      // Xác định Role cao nhất của user
      let role = "reader";
      if (roles.includes("admin")) role = "admin";
      else if (roles.includes("omod")) role = "omod";
      else if (roles.includes("cmod")) role = "cmod";
      else if (roles.includes("author") || user.isAuthorApproved)
        role = "author";

      // A. LOGIC CHO STAFF (Admin, Omod, Cmod)

      //  Staff đi lung tung (ra trang chủ, trang truyện...), bắt về Dashboard ngay.
      if (STAFF_CONFIG[role]) {
        const config = STAFF_CONFIG[role];

        // Kiểm tra: Nếu đường dẫn hiện tại KHÔNG bắt đầu bằng vùng cho phép
        if (!pathname.startsWith(config.allowedBase)) {
          const url = request.nextUrl.clone();
          url.pathname = config.dashboard;
          return NextResponse.redirect(url);
        }
      }

      // B. LOGIC CHO READER/AUTHOR
      //Ngăn chặn Reader tò mò gõ đường dẫn của Staff
      if (role === "reader" || role === "author") {
        if (
          pathname.startsWith("/Admin") ||
          pathname.startsWith("/Op") ||
          pathname.startsWith("/Content")
        ) {
          const url = request.nextUrl.clone();
          url.pathname = "/"; // Đá về trang chủ
          return NextResponse.redirect(url);
        }
      }
    } catch (error) {
      console.error("Middleware cookie parse error:", error);
    }
  }
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
  // matcher: ["/author-upgrade", "/author/:path*"],
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|register).*)"],
};
