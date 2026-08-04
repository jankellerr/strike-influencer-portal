import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await verifyAdminSession();
  const { id } = await params;

  await prisma.shipment.deleteMany({ where: { id } });

  return NextResponse.redirect(new URL("/admin/shipments", request.url), 303);
}
