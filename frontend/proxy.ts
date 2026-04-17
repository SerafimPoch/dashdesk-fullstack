import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const hasAccessToken = !!request.cookies.get("accessToken");
  const pathname = request.nextUrl.pathname;

  if (hasAccessToken && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
