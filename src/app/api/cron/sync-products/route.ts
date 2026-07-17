import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron/authorize";
import { syncProducts } from "@/lib/shopify/syncProducts";

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncProducts();
  return NextResponse.json({ ok: true, ...result });
}
