import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: ["/", "/attendance"],
};

export function proxy(request: NextRequest) {
  const session = request.cookies.get("appwrite-session");

  // 1) If user visits "/", redirect to "/attendance" if logged in
  if (request.nextUrl.pathname === "/") {
    if (session?.value) {
      return NextResponse.redirect(new URL("/attendance", request.url));
    } else {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}
