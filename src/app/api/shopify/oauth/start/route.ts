import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

const SCOPES = "read_products";
const STATE_COOKIE = "shopify_oauth_state";

/**
 * One-time, developer-run flow: visiting this route kicks off the standard
 * OAuth authorization code grant so the store owner can approve access and
 * we get a permanent offline token back (see ../callback/route.ts).
 * Not linked from anywhere in the app UI — it's a setup utility.
 */
export async function GET() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const appBaseUrl = process.env.APP_BASE_URL;

  if (!domain || !clientId || !appBaseUrl) {
    return NextResponse.json(
      { error: "Missing SHOPIFY_STORE_DOMAIN, SHOPIFY_CLIENT_ID, or APP_BASE_URL in .env" },
      { status: 500 },
    );
  }

  const state = randomBytes(16).toString("hex");
  const redirectUri = `${appBaseUrl}/api/shopify/oauth/callback`;

  const authorizeUrl = new URL(`https://${domain}/admin/oauth/authorize`);
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("scope", SCOPES);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}
