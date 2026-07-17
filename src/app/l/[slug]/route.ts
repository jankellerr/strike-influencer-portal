import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const utmLink = await prisma.utmLink.findUnique({
    where: { slug },
    include: { product: true },
  });

  if (!utmLink) {
    return NextResponse.redirect(new URL("/", request.url), 302);
  }

  // Fire-and-forget click logging — don't make the redirect wait on it.
  prisma.clickEvent
    .create({
      data: {
        utmLinkId: utmLink.id,
        referrer: request.headers.get("referer"),
        userAgent: request.headers.get("user-agent"),
      },
    })
    .catch((err: unknown) => console.error("Failed to log click event", err));

  const target = new URL(utmLink.product.onlineStoreUrl);
  target.searchParams.set("utm_source", utmLink.utmSource);
  target.searchParams.set("utm_medium", utmLink.utmMedium);
  target.searchParams.set("utm_campaign", utmLink.utmCampaign);

  return NextResponse.redirect(target, 302);
}
