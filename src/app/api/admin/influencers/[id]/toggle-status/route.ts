import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const influencer = await prisma.influencer.findUnique({ where: { id } });
  if (influencer) {
    await prisma.influencer.update({
      where: { id },
      data: { status: influencer.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" },
    });
  }

  return NextResponse.redirect(new URL("/admin", request.url), 303);
}
