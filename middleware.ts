import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const STAFF_ROLES = ["admin", "omod", "cmod"];

const isStaff = (role?: string) =>
  !!role && STAFF_ROLES.includes(role);

const isAuthor = (user: any) =>
  user?.roles?.includes("author") || user?.isAuthorApproved;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userCookie = request.cookies.get("authUser");

  let user: any = null;

  if (userCookie) {
    try {
      user = JSON.parse(userCookie.value);
    } catch {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  const role = user?.role;

  /* =================================================
     1️⃣ AUTHOR / READER KHÔNG ĐƯỢC VÀO STAFF
     ================================================= */
  if (
    !isStaff(role) &&
    (pathname.startsWith("/Op") || pathname.startsWith("/Admin"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  /* =================================================
     2️⃣ STAFF KHÔNG ĐƯỢC VÀO USER / AUTHOR
     👉 ĐÁ VỀ LOGIN
     ================================================= */
  const userAuthorRoutes = [
    "/",
    "/search",
    "/profile",
    "/author",
    "/author-upgrade",
  ];

  if (
    isStaff(role) &&
    userAuthorRoutes.some(
      (path) =>
        pathname === path || pathname.startsWith(path + "/")
    )
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  /* =================================================
     3️⃣ /author-upgrade
     ================================================= */
  if (pathname === "/author-upgrade") {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    if (isStaff(role)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    if (isAuthor(user)) {
      const url = request.nextUrl.clone();
      url.pathname = "/author/overview";
      return NextResponse.redirect(url);
    }
  }

  /* =================================================
     4️⃣ /author/*
     ================================================= */
  if (pathname.startsWith("/author/") && pathname !== "/author-upgrade") {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    if (isStaff(role)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    if (!isAuthor(user)) {
      // cho client-side refresh token
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/search/:path*",
    "/profile/:path*",
    "/author-upgrade",
    "/author/:path*",
    "/Op/:path*",
    "/Admin/:path*",
  ],
};
