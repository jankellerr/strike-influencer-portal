import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminSession } from "@/lib/session";

function passwordsMatch(submitted: string, expected: string): boolean {
  const submittedBuf = Buffer.from(submitted);
  const expectedBuf = Buffer.from(expected);
  if (submittedBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(submittedBuf, expectedBuf);
}

export async function POST(request: NextRequest) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");

  if (!password || !passwordsMatch(password, expected)) {
    const url = new URL("/admin/login?error=1", request.url);
    return NextResponse.redirect(url, 303);
  }

  await createAdminSession();
  return NextResponse.redirect(new URL("/admin", request.url), 303);
}
