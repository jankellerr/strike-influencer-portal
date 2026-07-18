import { NextRequest, NextResponse } from "next/server";
import { backfillOrders } from "@/lib/yampi/backfillOrders";

export async function POST(request: NextRequest) {
  await backfillOrders();
  return NextResponse.redirect(new URL("/admin", request.url), 303);
}
