import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const session = request.cookies.get("appwrite-session")?.value;
  const label = request.cookies.get("user-label")?.value; // "admin" | ""

  // 🚫 Not logged in → always go to /login
  if (!session) {
    if (pathname !== "/login") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // 🔁 Logged-in users should never see /login
  if (pathname === "/login") {
    if (label === "admin") {
      return NextResponse.redirect(new URL("/attendance", request.url));
    }
    return NextResponse.redirect(new URL("/mark-attendance", request.url));
  }

  // 🏠 Root redirect
  if (pathname === "/") {
    if (label === "admin") {
      return NextResponse.redirect(new URL("/attendance", request.url));
    }
    return NextResponse.redirect(new URL("/mark-attendance", request.url));
  }

  // 🔒 Admin-only routes (non-admins blocked)
  if (
    (pathname.startsWith("/attendance") ||
      pathname.startsWith("/register") ||
      pathname.startsWith("/users")) &&
    label !== "admin"
  ) {
    return NextResponse.redirect(new URL("/mark-attendance", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/attendance",
    "/register",
    "/mark-attendance",
    "/my-attendance",
    "/users",
  ],
};
