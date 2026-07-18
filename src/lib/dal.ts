import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getAdminSessionFromCookies } from "@/lib/session";

/**
 * Secure check for use in pages/Server Components: redirects to login if
 * there's no valid session. cache()-wrapped so multiple calls during one
 * render pass don't re-verify redundantly.
 */
export const verifyAdminSession = cache(async () => {
  const session = await getAdminSessionFromCookies();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
});
