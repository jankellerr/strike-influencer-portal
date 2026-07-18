import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendMagicLinkEmail } from "@/lib/email";

const RequestLoginSchema = z.object({ email: z.email().trim() });
const TOKEN_TTL_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const parsed = RequestLoginSchema.safeParse({ email: formData.get("email") });

  // Always redirect to the same "check your email" page regardless of outcome,
  // so this endpoint doesn't reveal which emails are registered.
  const sentUrl = new URL("/login?sent=1", request.url);

  if (!parsed.success) {
    return NextResponse.redirect(sentUrl, 303);
  }

  const influencer = await prisma.influencer.findUnique({
    where: { email: parsed.data.email },
  });

  if (influencer && influencer.status === "ACTIVE") {
    const token = randomBytes(32).toString("base64url");
    await prisma.loginToken.create({
      data: {
        token,
        influencerId: influencer.id,
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    });

    const appBaseUrl = process.env.APP_BASE_URL;
    if (!appBaseUrl) {
      throw new Error("Missing required env var: APP_BASE_URL");
    }
    const magicLink = `${appBaseUrl}/api/login/verify?token=${token}`;
    await sendMagicLinkEmail(influencer.email, magicLink);
  }

  return NextResponse.redirect(sentUrl, 303);
}
