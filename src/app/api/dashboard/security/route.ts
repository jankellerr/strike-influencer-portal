import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyInfluencerSession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

const SetPasswordSchema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
});

export async function POST(request: NextRequest) {
  const session = await verifyInfluencerSession();

  const formData = await request.formData();
  const parsed = SetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return NextResponse.redirect(new URL("/dashboard/security?error=short", request.url), 303);
  }

  if (parsed.data.password !== parsed.data.confirmPassword) {
    return NextResponse.redirect(new URL("/dashboard/security?error=mismatch", request.url), 303);
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.influencer.update({
    where: { id: session.influencerId },
    data: { passwordHash },
  });

  return NextResponse.redirect(new URL("/dashboard/security?success=1", request.url), 303);
}
