import { prisma } from "@/lib/prisma";

/**
 * Confirmed against real orders via GET /v2/{alias}/orders and
 * GET /v2/{alias}/orders/{id} — both the webhook payload's `resource` and the
 * REST order objects share this shape. Notably: there is no `paid_at` field
 * on the order resource at all (despite what Yampi's docs implied) — Order.paidAt
 * is left null until we design a real "paid" transition mapping (e.g. from
 * status alias history), so it's not populated yet.
 */
export interface YampiOrderData {
  id: number;
  status: { data?: { alias?: string } } | string;
  value_total: number;
  value_discount: number;
  promocode_id: number | null;
}

export async function upsertOrder(order: YampiOrderData) {
  const coupon = order.promocode_id
    ? await prisma.coupon.findUnique({
        where: { yampiPromoId: String(order.promocode_id) },
      })
    : null;

  const status =
    typeof order.status === "string" ? order.status : (order.status?.data?.alias ?? "unknown");

  await prisma.order.upsert({
    where: { yampiOrderId: String(order.id) },
    create: {
      yampiOrderId: String(order.id),
      couponId: coupon?.id ?? null,
      status,
      valueTotal: order.value_total,
      valueDiscount: order.value_discount ?? 0,
      rawItems: {},
    },
    update: {
      couponId: coupon?.id ?? null,
      status,
      valueTotal: order.value_total,
      valueDiscount: order.value_discount ?? 0,
    },
  });
}
