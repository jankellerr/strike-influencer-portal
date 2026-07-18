import { prisma } from "@/lib/prisma";
import { parseYampiDate } from "@/lib/yampi/parseYampiDate";

/**
 * Confirmed against real orders via GET /v2/{alias}/orders and
 * GET /v2/{alias}/orders/{id} — both the webhook payload's `resource` and the
 * REST order objects share this shape. Notably: there is no `paid_at` field
 * on the order resource at all (despite what Yampi's docs implied); `created_at`
 * is the real, reliable order date used for period-based reporting.
 * `value_products` is the product-only value (excludes shipping/tax) — the
 * base influencer commission is calculated from, per Strike's business rule.
 */
export interface YampiOrderData {
  id: number;
  status: { data?: { alias?: string } } | string;
  value_total: number;
  value_discount: number;
  value_products: number;
  promocode_id: number | null;
  created_at: { date: string; timezone?: string };
}

export async function upsertOrder(order: YampiOrderData) {
  const coupon = order.promocode_id
    ? await prisma.coupon.findUnique({
        where: { yampiPromoId: String(order.promocode_id) },
      })
    : null;

  const status =
    typeof order.status === "string" ? order.status : (order.status?.data?.alias ?? "unknown");
  const orderedAt = parseYampiDate(order.created_at);

  await prisma.order.upsert({
    where: { yampiOrderId: String(order.id) },
    create: {
      yampiOrderId: String(order.id),
      couponId: coupon?.id ?? null,
      status,
      valueTotal: order.value_total,
      valueDiscount: order.value_discount ?? 0,
      valueProducts: order.value_products,
      orderedAt,
      rawItems: {},
    },
    update: {
      couponId: coupon?.id ?? null,
      status,
      valueTotal: order.value_total,
      valueDiscount: order.value_discount ?? 0,
      valueProducts: order.value_products,
      orderedAt,
    },
  });
}
