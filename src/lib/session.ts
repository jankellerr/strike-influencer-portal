import "server-only";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";

const ADMIN_SESSION_COOKIE = "strike_admin_session";
const INFLUENCER_SESSION_COOKIE = "strike_influencer_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Missing required env var: AUTH_SECRET");
  return new TextEncoder().encode(secret);
}

interface AdminSessionPayload extends JWTPayload {
  role: "admin";
}

interface InfluencerSessionPayload extends JWTPayload {
  role: "influencer";
  influencerId: string;
}

async function encrypt(payload: AdminSessionPayload | InfluencerSessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

async function decryptAdmin(token: string | undefined): Promise<AdminSessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: ["HS256"] });
    if (payload.role !== "admin") return null;
    return { role: "admin" };
  } catch {
    return null;
  }
}

async function decryptInfluencer(
  token: string | undefined,
): Promise<InfluencerSessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: ["HS256"] });
    if (payload.role !== "influencer" || typeof payload.influencerId !== "string") return null;
    return { role: "influencer", influencerId: payload.influencerId };
  } catch {
    return null;
  }
}

export async function createAdminSession(): Promise<void> {
  const token = await encrypt({ role: "admin" });
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(Date.now() + SESSION_DURATION_MS),
    path: "/",
  });
}

export async function deleteAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function getAdminSessionFromCookies(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  return decryptAdmin(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function getAdminSessionFromRequestCookie(
  cookieValue: string | undefined,
): Promise<AdminSessionPayload | null> {
  return decryptAdmin(cookieValue);
}

export async function createInfluencerSession(influencerId: string): Promise<void> {
  const token = await encrypt({ role: "influencer", influencerId });
  const cookieStore = await cookies();
  cookieStore.set(INFLUENCER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(Date.now() + SESSION_DURATION_MS),
    path: "/",
  });
}

export async function deleteInfluencerSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(INFLUENCER_SESSION_COOKIE);
}

export async function getInfluencerSessionFromCookies(): Promise<InfluencerSessionPayload | null> {
  const cookieStore = await cookies();
  return decryptInfluencer(cookieStore.get(INFLUENCER_SESSION_COOKIE)?.value);
}

export async function getInfluencerSessionFromRequestCookie(
  cookieValue: string | undefined,
): Promise<InfluencerSessionPayload | null> {
  return decryptInfluencer(cookieValue);
}

export { ADMIN_SESSION_COOKIE, INFLUENCER_SESSION_COOKIE };
