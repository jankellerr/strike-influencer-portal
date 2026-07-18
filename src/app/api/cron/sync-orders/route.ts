import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron/authorize";
import { backfillOrders } from "@/lib/yampi/backfillOrders";

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await backfillOrders();
  return NextResponse.json({ ok: true, ...result });
}
