import { NextRequest, NextResponse } from "next/server";
import {
  getAdminSessionFromRequestCookie,
  getInfluencerSessionFromRequestCookie,
  ADMIN_SESSION_COOKIE,
  INFLUENCER_SESSION_COOKIE,
} from "@/lib/session";

/**
 * Optimistic auth check (cookie-only, no DB call) for the admin and
 * influencer-dashboard areas. `proxy.ts` is this Next.js version's renamed
 * `middleware.ts` — the `middleware` file convention is deprecated in favor
 * of `proxy`.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminLoginRoute = pathname === "/admin/login" || pathname === "/api/admin/login";
  const isAdminArea = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  if (isAdminArea && !isAdminLoginRoute) {
    const session = await getAdminSessionFromRequestCookie(
      request.cookies.get(ADMIN_SESSION_COOKIE)?.value,
    );
    if (!session) {
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  const isInfluencerPublicRoute =
    pathname === "/login" || pathname.startsWith("/api/login");
  const isInfluencerArea = pathname.startsWith("/dashboard") || pathname.startsWith("/api/dashboard");

  if (isInfluencerArea && !isInfluencerPublicRoute) {
    const session = await getInfluencerSessionFromRequestCookie(
      request.cookies.get(INFLUENCER_SESSION_COOKIE)?.value,
    );
    if (!session) {
      if (pathname.startsWith("/api/dashboard")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/dashboard/:path*", "/api/dashboard/:path*"],
};
