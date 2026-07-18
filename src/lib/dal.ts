import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getAdminSessionFromCookies, getInfluencerSessionFromCookies } from "@/lib/session";

/**
 * Secure checks for use in pages/Server Components: redirect to login if
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

export const verifyInfluencerSession = cache(async () => {
  const session = await getInfluencerSessionFromCookies();
  if (!session) {
    redirect("/login");
  }
  return session;
});
