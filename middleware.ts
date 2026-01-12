//middleware.ts
// ============================================
// NEXT.JS MIDDLEWARE - BẢO VỆ ROUTE TRÊN SERVER-SIDE
// MỤC ĐÍCH: Chạy trên server trước khi render trang, kiểm tra quyền truy cập dựa trên role
// CƠ CHẾ:
// 1. Lấy cookie authUser để xác định thông tin người dùng
// 2. Phân tích role và redirect về đúng khu vực
// 3. Ngăn chặn truy cập trái phép giữa các role
// LIÊN THÔNG VỚI: AuthContext (cùng cấu trúc cookie), các route trong app
// ============================================
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
// [THAY ĐỔI 1]: Cấu hình đường dẫn cho Staff để dễ quản lý
// TẠI SAO CẦN: Map role -> đường dẫn dashboard và khu vực được phép
// LOGIC: Mỗi staff role chỉ được truy cập trong khu vực riêng (Admin, Op, Content)
const STAFF_CONFIG: Record<string, { dashboard: string; allowedBase: string }> =
  {
    admin: {
      dashboard: "/Admin", // Admin dashboard
      allowedBase: "/Admin", // Chỉ được truy cập /Admin/**
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
// Main middleware function
// MỤC ĐÍCH: Xử lý mọi request đến Next.js server (trừ các route được exclude)
// ĐẦU VÀO: NextRequest (chứa URL, cookies, headers)
// ĐẦU RA: NextResponse (cho phép tiếp tục hoặc redirect)
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl; // Lấy đường dẫn hiện tại (ví dụ: "/admin/dashboard")
  const userCookie = request.cookies.get("authUser"); // Lấy cookie authUser (lưu bởi AuthContext)

  // [THAY ĐỔI 2]: Thêm logic kiểm tra Role Staff ngay đầu hàm
  // TẠI SAO: Ưu tiên xử lý staff trước, vì họ có quyền cao nhất
  if (userCookie) {
    try {
      const user = JSON.parse(userCookie.value);
      const roles = user.roles || []; // Lấy roles từ user

      // Xác định Role cao nhất của user (ưu tiên: admin > omod > cmod > author > reader)
      let role = "reader"; // Mặc định là reader
      if (roles.includes("admin")) role = "admin";
      else if (roles.includes("omod")) role = "omod";
      else if (roles.includes("cmod")) role = "cmod";
      else if (roles.includes("author") || user.isAuthorApproved)
        role = "author";

      // ============================================
      // A. LOGIC CHO STAFF (Admin, Omod, Cmod)
      // MỤC ĐÍCH: Giữ staff trong khu vực riêng, không cho đi lung tung
      // ============================================

      // Nếu Staff đi lung tung (ra trang chủ, trang truyện...), bắt về Dashboard ngay.
      if (STAFF_CONFIG[role]) {
        // Nếu role có trong STAFF_CONFIG
        const config = STAFF_CONFIG[role]; // Lấy config tương ứng

        // Kiểm tra: Nếu đường dẫn hiện tại KHÔNG bắt đầu bằng vùng cho phép
        // VÍ DỤ: admin cố vào /Content/review sẽ bị redirect về /Admin
        if (!pathname.startsWith(config.allowedBase)) {
          const url = request.nextUrl.clone(); // Clone URL hiện tại
          url.pathname = config.dashboard; // Thay đổi pathname thành dashboard
          return NextResponse.redirect(url); // Redirect đến dashboard
        }
      }

      // ============================================
      // B. LOGIC CHO READER/AUTHOR
      // Ngăn chặn Reader/Author tò mò gõ đường dẫn của Staff
      // ============================================
      if (role === "reader" || role === "author") {
        // Nếu reader/author cố truy cập khu vực staff
        if (
          pathname.startsWith("/Admin") || // Cố vào admin area
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
      // Nếu parse cookie lỗi, tiếp tục xử lý bình thường
      // TẠI SAO KHÔNG BLOCK: Có thể cookie bị hỏng, để request tiếp tục rồi AuthContext sẽ xử lý
    }
  }

  // ============================================
  // C. LOGIC CHO TRANG AUTHOR-UPGRADE
  // MỤC ĐÍCH: Ngăn author đã approved truy cập lại trang upgrade
  // ============================================
  if (pathname === "/author-upgrade") {
    if (userCookie) {
      try {
        const user = JSON.parse(userCookie.value);
        const isAlreadyAuthor =
          user.roles?.includes("author") || user.isAuthorApproved;
        // Nếu đã là author, redirect đến author overview
        if (isAlreadyAuthor) {
          const url = request.nextUrl.clone();
          url.pathname = "/author/overview";
          return NextResponse.redirect(url);
        }
      } catch (e) {
        // Nếu parse lỗi, tiếp tục
      }
    }
  }
  // ============================================
  // D. LOGIC CHO KHU VỰC AUTHOR
  // MỤC ĐÍCH: Bảo vệ tất cả route bắt đầu bằng "/author/" (trừ "/author-upgrade")
  // CHỈ AUTHOR MỚI ĐƯỢC VÀO
  // ============================================
  // Bảo vệ tất cả route bắt đầu bằng "/author/" (trừ "/author-upgrade")
  if (pathname.startsWith("/author/") && pathname !== "/author-upgrade") {
    if (userCookie) {
      try {
        const user = JSON.parse(userCookie.value);
        const isAuthor =
          user.roles?.includes("author") || user.isAuthorApproved;
        // Nếu không phải author, redirect về login
        if (!isAuthor) return NextResponse.next();
      } catch (error) {
        // Nếu là author, cho phép tiếp tục (return NextResponse.next())
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
      }
    } else {
      // Nếu không có cookie (chưa đăng nhập), redirect về login
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }
  // Nếu tất cả điều kiện đều pass, cho phép request tiếp tục
  return NextResponse.next();
}

// ============================================
// MIDDLEWARE CONFIG - XÁC ĐỊNH ROUTE NÀO CHẠY MIDDLEWARE
// MỤC ĐÍCH: Config pattern để middleware chỉ chạy trên các route cần bảo vệ
// TẠI SAO: Tránh chạy middleware trên static files, API routes,...
// ============================================
export const config = {
  matcher: [
    // Tại sao: Cần quét cả trang chủ "/" để bắt Staff đi lạc.
    // Logic cũ chỉ quét "/author/:path*" nên Staff ra trang chủ sẽ không bị chặn.
    "/((?!api|_next/static|_next/image|favicon.ico|login|register).*)",
    // Giải thích pattern:
    // - `/`: Bắt đầu từ root
    // - `(?!...)`: Negative lookahead - KHÔNG match với các pattern sau
    // - `api`: Không chạy middleware cho API routes
    // - `_next/static`: Không chạy cho static files của Next.js
    // - `_next/image`: Không chạy cho image optimization
    // - `favicon.ico`: Không chạy cho favicon
    // - `login|register`: Không chạy cho trang login và register
    // - `.*`: Match tất cả route còn lại

    // Tại sao: Cần quét cả trang chủ "/" để bắt Staff đi lạc.
    // Logic cũ chỉ quét "/author/:path*" nên Staff ra trang chủ sẽ không bị chặn.
  ],
};
