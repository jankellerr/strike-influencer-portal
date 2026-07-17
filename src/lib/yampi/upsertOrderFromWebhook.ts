import { prisma } from "@/lib/prisma";

/**
 * Shape based on Yampi's documented order.created/order.paid/order.status.updated
 * payloads. Field names should be double-checked against a real payload the first
 * time a live webhook is received (Yampi's docs don't publish a full JSON schema) —
 * log the raw body in Phase 1 testing and adjust this type if anything doesn't match.
 */
export interface YampiOrderWebhookPayload {
  resource: {
    id: number;
    status: { data?: { alias?: string } } | string;
    value_total: number;
    value_discount: number;
    promocode_id: number | null;
    paid_at?: string | null;
    items?: unknown;
  };
}

export async function upsertOrderFromWebhook(payload: YampiOrderWebhookPayload) {
  const order = payload.resource;

  const coupon = order.promocode_id
    ? await prisma.coupon.findUnique({
        where: { yampiPromoId: String(order.promocode_id) },
      })
    : null;

  const status =
    typeof order.status === "string" ? order.status : order.status?.data?.alias ?? "unknown";

  await prisma.order.upsert({
    where: { yampiOrderId: String(order.id) },
    create: {
      yampiOrderId: String(order.id),
      couponId: coupon?.id ?? null,
      status,
      valueTotal: order.value_total,
      valueDiscount: order.value_discount ?? 0,
      paidAt: order.paid_at ? new Date(order.paid_at) : null,
      rawItems: (order.items ?? {}) as object,
    },
    update: {
      couponId: coupon?.id ?? null,
      status,
      valueTotal: order.value_total,
      valueDiscount: order.value_discount ?? 0,
      paidAt: order.paid_at ? new Date(order.paid_at) : null,
      rawItems: (order.items ?? {}) as object,
    },
  });
}
