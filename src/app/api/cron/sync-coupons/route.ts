import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron/authorize";
import { syncCoupons } from "@/lib/yampi/syncCoupons";

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncCoupons();
  return NextResponse.json({ ok: true, ...result });
}
