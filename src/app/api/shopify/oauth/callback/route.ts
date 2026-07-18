import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

const STATE_COOKIE = "shopify_oauth_state";

function verifyHmac(searchParams: URLSearchParams, clientSecret: string): boolean {
  const received = searchParams.get("hmac");
  if (!received) return false;

  const pairs: string[] = [];
  for (const [key, value] of searchParams.entries()) {
    if (key === "hmac" || key === "signature") continue;
    pairs.push(`${key}=${value}`);
  }
  pairs.sort();
  const message = pairs.join("&");

  const expected = createHmac("sha256", clientSecret).update(message).digest("hex");

  const expectedBuf = Buffer.from(expected);
  const receivedBuf = Buffer.from(received);
  if (expectedBuf.length !== receivedBuf.length) return false;
  return timingSafeEqual(expectedBuf, receivedBuf);
}

/**
 * Callback for the one-time OAuth setup flow (see ../start/route.ts). Exchanges
 * the authorization code for a permanent offline access token and displays it
 * once so it can be copied into .env as SHOPIFY_ADMIN_ACCESS_TOKEN. This route
 * never stores the token itself — it's a manual setup step, run once.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

  if (!domain || !clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Missing SHOPIFY_STORE_DOMAIN, SHOPIFY_CLIENT_ID, or SHOPIFY_CLIENT_SECRET" },
      { status: 500 },
    );
  }

  const state = searchParams.get("state");
  const cookieState = request.cookies.get(STATE_COOKIE)?.value;
  if (!state || !cookieState || state !== cookieState) {
    return NextResponse.json({ error: "Invalid or missing state" }, { status: 400 });
  }

  const shop = searchParams.get("shop");
  if (shop !== domain) {
    return NextResponse.json({ error: "Shop mismatch" }, { status: 400 });
  }

  if (!verifyHmac(searchParams, clientSecret)) {
    return NextResponse.json({ error: "HMAC verification failed" }, { status: 401 });
  }

  const code = searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
  }

  const tokenRes = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.json(
      { error: `Token exchange failed ${tokenRes.status}: ${await tokenRes.text()}` },
      { status: 502 },
    );
  }

  const json = (await tokenRes.json()) as { access_token: string; scope: string };

  const html = `<!doctype html><html><body style="font-family: monospace; padding: 2rem;">
    <h2>Shopify authorization succeeded</h2>
    <p>Granted scope: <strong>${json.scope}</strong></p>
    <p>Copy this into .env as SHOPIFY_ADMIN_ACCESS_TOKEN, then you can delete this route:</p>
    <pre style="background:#eee;padding:1rem;word-break:break-all;">${json.access_token}</pre>
  </body></html>`;

  const response = new NextResponse(html, { headers: { "Content-Type": "text/html" } });
  response.cookies.delete(STATE_COOKIE);
  return response;
}
