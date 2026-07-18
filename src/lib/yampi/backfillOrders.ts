import { listAllOrders } from "@/lib/yampi/client";
import { upsertOrder } from "@/lib/yampi/upsertOrder";

/**
 * Scans every order in Yampi and upserts the ones whose coupon is mapped to
 * an influencer. Needed because the webhook only captures orders placed
 * *after* it was set up — this fills in pre-existing order history for a
 * coupon the moment it gets mapped (and can be re-run any time as a safety
 * net for missed webhooks). Cheap for Strike's current order volume (~100
 * orders, one API page); revisit with real filtering if that grows a lot.
 */
export async function backfillOrders(): Promise<{ matched: number; scanned: number }> {
  const orders = await listAllOrders();
  let matched = 0;

  for (const order of orders) {
    if (order.promocode_id == null) continue;
    await upsertOrder(order);
    matched += 1;
  }

  return { matched, scanned: orders.length };
}
