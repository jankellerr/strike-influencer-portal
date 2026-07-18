/**
 * Strike's influencer commission rule: 5% of the PRODUCT value of the sale
 * only -- excludes shipping, taxes, and installment fees. Sourced from
 * Order.valueProducts (Yampi's value_products field), not valueTotal.
 */
export const COMMISSION_RATE = 0.05;

export function calculateCommission(totalProductValue: number): number {
  return totalProductValue * COMMISSION_RATE;
}
