import { prisma } from "@/lib/prisma";
import { listAllPromocodes } from "@/lib/yampi/client";

/**
 * Reconciliation pass: updates known coupons' code/discount/active state from Yampi.
 * Does NOT create new Coupon rows — an admin must explicitly map a Yampi promocode
 * to an Influencer (see admin panel), since a coupon is meaningless without that link.
 */
export async function syncCoupons(): Promise<{ updated: number; skipped: number }> {
  const promocodes = await listAllPromocodes();
  let updated = 0;
  let skipped = 0;

  for (const promo of promocodes) {
    const result = await prisma.coupon.updateMany({
      where: { yampiPromoId: String(promo.id) },
      data: {
        code: promo.code,
        discountType: promo.discount_type,
        discountValue: promo.value,
        active: promo.active,
      },
    });

    if (result.count > 0) {
      updated += 1;
    } else {
      skipped += 1;
    }
  }

  return { updated, skipped };
}
