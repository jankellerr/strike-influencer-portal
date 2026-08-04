import "server-only";
import { prisma } from "@/lib/prisma";
import { EXCLUDED_FROM_REVENUE_STATUSES } from "@/lib/orderStatus";
import { calculateCommission } from "@/lib/commission";

/**
 * "Best overall" composite weights. Revenue and ROI dominate since those are
 * what the program ultimately exists to produce; orders and click→order
 * conversion round out the picture. Tune here if Strike's priorities shift --
 * same pattern as COMMISSION_RATE in src/lib/commission.ts.
 */
const SCORE_WEIGHT_REVENUE = 0.35;
const SCORE_WEIGHT_ROI = 0.3;
const SCORE_WEIGHT_ORDERS = 0.2;
const SCORE_WEIGHT_CONVERSION = 0.15;

export interface InfluencerPeriodMetrics {
  influencerId: string;
  name: string;
  email: string;
  couponCode: string | null;
  status: "ACTIVE" | "INACTIVE";
  revenue: number;
  orderCount: number;
  averageOrderValue: number;
  productValue: number;
  commission: number;
  clicks: number;
  /** orders / clicks, null when there's no click data to divide by. */
  conversionRate: number | null;
}

/** Per-influencer sales/commission/click metrics for orders placed in [start, end). */
export async function getInfluencerMetricsForPeriod(
  start: Date,
  end: Date,
): Promise<InfluencerPeriodMetrics[]> {
  const influencers = await prisma.influencer.findMany({
    include: {
      coupon: {
        include: {
          orders: {
            where: {
              status: { notIn: EXCLUDED_FROM_REVENUE_STATUSES },
              orderedAt: { gte: start, lt: end },
            },
            select: { valueTotal: true, valueProducts: true },
          },
        },
      },
      utmLinks: {
        include: {
          clickEvents: {
            where: { clickedAt: { gte: start, lt: end } },
            select: { id: true },
          },
        },
      },
    },
  });

  return influencers.map((influencer) => {
    const orders = influencer.coupon?.orders ?? [];
    const revenue = orders.reduce((sum, o) => sum + Number(o.valueTotal), 0);
    const productValue = orders.reduce((sum, o) => sum + Number(o.valueProducts ?? 0), 0);
    const orderCount = orders.length;
    const clicks = influencer.utmLinks.reduce((sum, link) => sum + link.clickEvents.length, 0);

    return {
      influencerId: influencer.id,
      name: influencer.name,
      email: influencer.email,
      couponCode: influencer.coupon?.code ?? null,
      status: influencer.status,
      revenue,
      orderCount,
      averageOrderValue: orderCount > 0 ? revenue / orderCount : 0,
      productValue,
      commission: calculateCommission(productValue),
      clicks,
      conversionRate: clicks > 0 ? orderCount / clicks : null,
    };
  });
}

/** Program-wide revenue (all influencers combined) for [start, end) -- powers the trend chart. */
export async function getProgramRevenueForPeriod(start: Date, end: Date): Promise<number> {
  const result = await prisma.order.aggregate({
    where: {
      couponId: { not: null },
      status: { notIn: EXCLUDED_FROM_REVENUE_STATUSES },
      orderedAt: { gte: start, lt: end },
    },
    _sum: { valueTotal: true },
  });
  return Number(result._sum.valueTotal ?? 0);
}

interface InfluencerShipmentInvestment {
  investment: number;
  shipmentCount: number;
}

/** Per-influencer shipment cost (shipping fee + line items) for shipments sent in [start, end). */
export async function getShipmentInvestmentForPeriod(
  start: Date,
  end: Date,
): Promise<Map<string, InfluencerShipmentInvestment>> {
  const shipments = await prisma.shipment.findMany({
    where: { shippedAt: { gte: start, lt: end } },
    select: {
      influencerId: true,
      shippingFee: true,
      items: { select: { quantity: true, unitCost: true } },
    },
  });

  const map = new Map<string, InfluencerShipmentInvestment>();
  for (const shipment of shipments) {
    const itemsCost = shipment.items.reduce((sum, item) => sum + item.quantity * Number(item.unitCost), 0);
    const total = Number(shipment.shippingFee) + itemsCost;
    const existing = map.get(shipment.influencerId) ?? { investment: 0, shipmentCount: 0 };
    existing.investment += total;
    existing.shipmentCount += 1;
    map.set(shipment.influencerId, existing);
  }
  return map;
}

export interface Roi {
  /** Revenue generated per unit invested, e.g. 4.2 means R$4.20 back per R$1 spent. */
  ratio: number;
  /** (revenue - investment) / investment * 100. */
  percent: number;
}

/** Null when there's no investment to divide by -- "no data", not "0% ROI". */
export function computeRoi(revenue: number, investment: number): Roi | null {
  if (investment <= 0) return null;
  return { ratio: revenue / investment, percent: ((revenue - investment) / investment) * 100 };
}

export interface ScoreBreakdown {
  /** Each 0-100, normalized against the rest of the influencer set for the period. */
  revenue: number;
  orders: number;
  roi: number | null;
  conversion: number | null;
}

export interface InfluencerFullMetrics extends InfluencerPeriodMetrics {
  investment: number;
  shipmentCount: number;
  roi: Roi | null;
  /** 0-100 composite "best overall" score, or null if there's only one influencer to rank. */
  score: number | null;
  scoreBreakdown: ScoreBreakdown | null;
}

function minMaxNormalize(values: number[]): (value: number) => number {
  const max = Math.max(...values);
  const min = Math.min(...values);
  if (max === min) return () => (max === 0 ? 0 : 1);
  return (value: number) => (value - min) / (max - min);
}

/**
 * Fills in `score`/`scoreBreakdown` on each row via min-max normalization
 * against the rest of the set. Influencers missing ROI or conversion data
 * (no shipments / no clicks yet) have that term's weight redistributed
 * proportionally across whichever terms they do have, rather than scored
 * as zero.
 */
function withPerformanceScore(rows: InfluencerFullMetrics[]): InfluencerFullMetrics[] {
  if (rows.length < 2) return rows.map((r) => ({ ...r, score: null, scoreBreakdown: null }));

  const normRevenue = minMaxNormalize(rows.map((r) => r.revenue));
  const normOrders = minMaxNormalize(rows.map((r) => r.orderCount));

  const roiValues = rows.filter((r) => r.roi !== null).map((r) => r.roi!.ratio);
  const normRoi = roiValues.length > 0 ? minMaxNormalize(roiValues) : null;

  const conversionValues = rows.filter((r) => r.conversionRate !== null).map((r) => r.conversionRate!);
  const normConversion = conversionValues.length > 0 ? minMaxNormalize(conversionValues) : null;

  return rows.map((row) => {
    const roiScore = normRoi && row.roi !== null ? normRoi(row.roi.ratio) * 100 : null;
    const conversionScore =
      normConversion && row.conversionRate !== null ? normConversion(row.conversionRate) * 100 : null;

    const terms: Array<{ weight: number; value: number }> = [
      { weight: SCORE_WEIGHT_REVENUE, value: normRevenue(row.revenue) },
      { weight: SCORE_WEIGHT_ORDERS, value: normOrders(row.orderCount) },
    ];
    if (roiScore !== null) terms.push({ weight: SCORE_WEIGHT_ROI, value: roiScore / 100 });
    if (conversionScore !== null) terms.push({ weight: SCORE_WEIGHT_CONVERSION, value: conversionScore / 100 });

    const totalWeight = terms.reduce((sum, t) => sum + t.weight, 0);
    const score = terms.reduce((sum, t) => sum + t.weight * t.value, 0) / totalWeight;

    return {
      ...row,
      score: score * 100,
      scoreBreakdown: {
        revenue: normRevenue(row.revenue) * 100,
        orders: normOrders(row.orderCount) * 100,
        roi: roiScore,
        conversion: conversionScore,
      },
    };
  });
}

/** Combined sales + ROI + composite-score metrics for every influencer over [start, end). */
export async function getInfluencerFullMetricsForPeriod(
  start: Date,
  end: Date,
): Promise<InfluencerFullMetrics[]> {
  const [metrics, investments] = await Promise.all([
    getInfluencerMetricsForPeriod(start, end),
    getShipmentInvestmentForPeriod(start, end),
  ]);

  const rows: InfluencerFullMetrics[] = metrics.map((metric) => {
    const inv = investments.get(metric.influencerId);
    const investment = inv?.investment ?? 0;
    return {
      ...metric,
      investment,
      shipmentCount: inv?.shipmentCount ?? 0,
      roi: computeRoi(metric.revenue, investment),
      score: null,
      scoreBreakdown: null,
    };
  });

  return withPerformanceScore(rows);
}
