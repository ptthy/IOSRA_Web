import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// [THAY ĐỔI 1]: Thêm cấu hình đường dẫn cho Staff để dễ quản lý
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

  // [THAY ĐỔI 2]: Thêm logic kiểm tra Role Staff ngay đầu hàm
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

      // Nếu Staff đi lung tung (ra trang chủ, trang truyện...), bắt về Dashboard ngay.
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
      // Ngăn chặn Reader tò mò gõ đường dẫn của Staff
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

  if (pathname === "/author-upgrade") {
    if (userCookie) {
      try {
        const user = JSON.parse(userCookie.value);
        const isAlreadyAuthor =
          user.roles?.includes("author") || user.isAuthorApproved;
        if (isAlreadyAuthor) {
          const url = request.nextUrl.clone();
          url.pathname = "/author/overview";
          return NextResponse.redirect(url);
        }
      } catch (e) {}
    }
  }

  if (pathname.startsWith("/author/") && pathname !== "/author-upgrade") {
    if (userCookie) {
      try {
        const user = JSON.parse(userCookie.value);
        const isAuthor =
          user.roles?.includes("author") || user.isAuthorApproved;
        if (!isAuthor) return NextResponse.next();
      } catch (error) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
      }
    } else {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// [ 3]: Sửa matcher để quét toàn bộ trang web
export const config = {
  matcher: [
    // Tại sao: Cần quét cả trang chủ "/" để bắt Staff đi lạc.
    // Logic cũ chỉ quét "/author/:path*" nên Staff ra trang chủ sẽ không bị chặn.
    "/((?!api|_next/static|_next/image|favicon.ico|login|register).*)",
  ],
};
