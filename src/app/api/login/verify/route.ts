import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createInfluencerSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const expiredUrl = new URL("/login?error=expired", request.url);

  if (!token) {
    return NextResponse.redirect(expiredUrl, 303);
  }

  const loginToken = await prisma.loginToken.findUnique({ where: { token } });

  if (
    !loginToken ||
    loginToken.usedAt !== null ||
    loginToken.expiresAt.getTime() < Date.now()
  ) {
    return NextResponse.redirect(expiredUrl, 303);
  }

  await prisma.loginToken.update({
    where: { id: loginToken.id },
    data: { usedAt: new Date() },
  });

  await createInfluencerSession(loginToken.influencerId);

  return NextResponse.redirect(new URL("/dashboard", request.url), 303);
}
