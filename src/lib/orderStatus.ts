/**
 * Confirmed against Strike's real order data: paid/on_carriage/invoiced/
 * delivered/handling_products/ready_for_shipping all represent a completed
 * sale; cancelled/refused don't. Denylist (not allowlist) so an unfamiliar
 * future status defaults to counted, matching how most order-progression
 * statuses behave.
 */
export const EXCLUDED_FROM_REVENUE_STATUSES = ["cancelled", "refused", "waiting_payment"];

export function countsAsRevenue(status: string): boolean {
  return !EXCLUDED_FROM_REVENUE_STATUSES.includes(status);
}
