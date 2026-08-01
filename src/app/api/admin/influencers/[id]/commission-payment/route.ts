import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/dal";
import { isValidMonthKey } from "@/lib/dateRanges";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await verifyAdminSession();
  const { id } = await params;

  const formData = await request.formData();
  const month = String(formData.get("month") ?? "");

  if (isValidMonthKey(month)) {
    const existing = await prisma.commissionPayment.findUnique({
      where: { influencerId_month: { influencerId: id, month } },
    });
    const nextPaid = !(existing?.paid ?? false);

    await prisma.commissionPayment.upsert({
      where: { influencerId_month: { influencerId: id, month } },
      create: { influencerId: id, month, paid: nextPaid, paidAt: nextPaid ? new Date() : null },
      update: { paid: nextPaid, paidAt: nextPaid ? new Date() : null },
    });
  }

  return NextResponse.redirect(new URL(`/admin?month=${month}`, request.url), 303);
}
