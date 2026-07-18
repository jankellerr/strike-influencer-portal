import { NextRequest, NextResponse } from "next/server";
import { verifyYampiWebhookSignature } from "@/lib/yampi/verifyWebhook";
import { upsertOrder, type YampiOrderData } from "@/lib/yampi/upsertOrder";

const ORDER_EVENTS = new Set(["order.created", "order.paid", "order.status.updated"]);

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-yampi-hmac-sha256");
  const webhookSecret = process.env.YAMPI_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("YAMPI_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  if (!verifyYampiWebhookSignature(rawBody, signature, webhookSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as { event: string; resource: YampiOrderData };

  if (!ORDER_EVENTS.has(payload.event)) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  await upsertOrder(payload.resource);

  return NextResponse.json({ ok: true });
}
