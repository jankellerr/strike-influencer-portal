import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequestCookie, SESSION_COOKIE } from "@/lib/session";

/**
 * Optimistic auth check (cookie-only, no DB call) for the admin area.
 * `proxy.ts` is this Next.js version's renamed `middleware.ts` — the
 * `middleware` file convention is deprecated in favor of `proxy`.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isLoginRoute = pathname === "/admin/login" || pathname === "/api/admin/login";
  const isAdminArea = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  if (!isAdminArea || isLoginRoute) {
    return NextResponse.next();
  }

  const session = await getAdminSessionFromRequestCookie(
    request.cookies.get(SESSION_COOKIE)?.value,
  );

  if (!session) {
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
