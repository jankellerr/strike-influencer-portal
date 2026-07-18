import { prisma } from "@/lib/prisma";
import { listAllPromocodes, type YampiPromocode } from "@/lib/yampi/client";

/** Active Yampi coupons not yet mapped to any Influencer — for the admin "new influencer" picker. */
export async function listUnmappedActivePromocodes(): Promise<YampiPromocode[]> {
  const [promocodes, mappedCoupons] = await Promise.all([
    listAllPromocodes(),
    prisma.coupon.findMany({ select: { yampiPromoId: true } }),
  ]);

  const mappedIds = new Set(mappedCoupons.map((c) => c.yampiPromoId));
  return promocodes.filter((p) => p.active && !mappedIds.has(String(p.id)));
}
