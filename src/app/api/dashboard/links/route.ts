import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { verifyInfluencerSession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

const CreateLinkSchema = z.object({ productId: z.string().trim().min(1) });

export async function POST(request: NextRequest) {
  const session = await verifyInfluencerSession();

  const formData = await request.formData();
  const parsed = CreateLinkSchema.safeParse({ productId: formData.get("productId") });

  if (!parsed.success) {
    return NextResponse.redirect(new URL("/dashboard/links?error=1", request.url), 303);
  }

  const influencer = await prisma.influencer.findUniqueOrThrow({
    where: { id: session.influencerId },
    include: { coupon: true },
  });

  const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } });
  if (!product) {
    return NextResponse.redirect(new URL("/dashboard/links?error=1", request.url), 303);
  }

  const slug = randomBytes(6).toString("base64url");
  const utmSource = influencer.coupon?.code.toLowerCase() ?? "influencer";

  await prisma.utmLink.create({
    data: {
      slug,
      influencerId: influencer.id,
      productId: product.id,
      utmSource,
      utmMedium: "influencer",
      utmCampaign: product.handle,
    },
  });

  return NextResponse.redirect(new URL("/dashboard/links", request.url), 303);
}
