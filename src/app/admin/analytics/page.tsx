import Link from "next/link";
import { verifyAdminSession } from "@/lib/dal";
import {
  getPeriodRangeBrazil,
  getPreviousPeriodRangeBrazil,
  getRecentPeriodOptionsBrazil,
  resolvePeriodParamsBrazil,
} from "@/lib/dateRanges";
import {
  type InfluencerFullMetrics,
  computeRoi,
  getInfluencerFullMetricsForPeriod,
  getProgramRevenueForPeriod,
} from "@/lib/analytics";
import { formatBRL, formatNumberBR, formatPercentBR } from "@/lib/format";
import { TopBar } from "@/components/TopBar";
import { AdminNav } from "@/components/AdminNav";
import { PeriodFilterFields } from "@/components/PeriodFilterFields";
import { TrendBarChart, type TrendBarChartPoint } from "@/components/TrendBarChart";
import { Button, Card, StatTile } from "@/components/ui";

const TREND_POINTS = 8;

type SortKey =
  | "revenue"
  | "orderCount"
  | "averageOrderValue"
  | "commission"
  | "investment"
  | "roi"
  | "clicks"
  | "conversionRate"
  | "score";

const SORT_LABELS: Record<SortKey, string> = {
  revenue: "Vendas",
  orderCount: "Pedidos",
  averageOrderValue: "Ticket médio",
  commission: "Comissão",
  investment: "Investimento",
  roi: "ROI",
  clicks: "Cliques",
  conversionRate: "Conversão",
  score: "Pontuação",
};

function sortValue(row: InfluencerFullMetrics, sort: SortKey): number {
  if (sort === "roi") return row.roi?.ratio ?? -Infinity;
  if (sort === "score") return row.score ?? -Infinity;
  if (sort === "conversionRate") return row.conversionRate ?? -Infinity;
  return row[sort];
}

function delta(current: number, previous: number): string | undefined {
  if (previous === 0) return undefined;
  const pct = ((current - previous) / previous) * 100;
  const arrow = pct >= 0 ? "▲" : "▼";
  return `${arrow} ${formatPercentBR(Math.abs(pct))} vs. período anterior`;
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; periodKey?: string; sort?: string; dir?: string }>;
}) {
  await verifyAdminSession();

  const { period: periodParam, periodKey: periodKeyParam, sort: sortParam, dir: dirParam } = await searchParams;
  const { period, periodKey } = resolvePeriodParamsBrazil(periodParam, periodKeyParam);
  const sort: SortKey = sortParam && sortParam in SORT_LABELS ? (sortParam as SortKey) : "score";
  const dir: "asc" | "desc" = dirParam === "asc" ? "asc" : "desc";

  const { start, end } = getPeriodRangeBrazil(period, periodKey);
  const { start: prevStart, end: prevEnd } = getPreviousPeriodRangeBrazil(period, periodKey);

  const [rows, prevRows] = await Promise.all([
    getInfluencerFullMetricsForPeriod(start, end),
    getInfluencerFullMetricsForPeriod(prevStart, prevEnd),
  ]);

  const totals = rows.reduce(
    (acc, r) => ({
      revenue: acc.revenue + r.revenue,
      orderCount: acc.orderCount + r.orderCount,
      commission: acc.commission + r.commission,
      investment: acc.investment + r.investment,
    }),
    { revenue: 0, orderCount: 0, commission: 0, investment: 0 },
  );
  const prevTotals = prevRows.reduce(
    (acc, r) => ({
      revenue: acc.revenue + r.revenue,
      orderCount: acc.orderCount + r.orderCount,
      commission: acc.commission + r.commission,
      investment: acc.investment + r.investment,
    }),
    { revenue: 0, orderCount: 0, commission: 0, investment: 0 },
  );
  const avgOrderValue = totals.orderCount > 0 ? totals.revenue / totals.orderCount : 0;
  const prevAvgOrderValue = prevTotals.orderCount > 0 ? prevTotals.revenue / prevTotals.orderCount : 0;
  const programRoi = computeRoi(totals.revenue, totals.investment);
  const activeCount = rows.filter((r) => r.status === "ACTIVE").length;

  // Trend chart: program-wide revenue for the last TREND_POINTS periods of this granularity, oldest first.
  const trendOptions = [...getRecentPeriodOptionsBrazil(period, TREND_POINTS)].reverse();
  const trendPoints: TrendBarChartPoint[] = await Promise.all(
    trendOptions.map(async (option) => {
      const range = getPeriodRangeBrazil(period, option.key);
      const value = await getProgramRevenueForPeriod(range.start, range.end);
      return { key: option.key, tick: option.key, label: option.label, value };
    }),
  );

  const top = (key: SortKey, filter?: (r: InfluencerFullMetrics) => boolean) => {
    const eligible = filter ? rows.filter(filter) : rows;
    return [...eligible].sort((a, b) => sortValue(b, key) - sortValue(a, key)).slice(0, 5);
  };

  const topRevenue = top("revenue");
  const topOrders = top("orderCount");
  const topCommission = top("commission");
  const topRoi = top("roi", (r) => r.roi !== null);
  const topScore = top("score", (r) => r.score !== null);

  const sortedTable = [...rows].sort((a, b) => {
    const diff = sortValue(a, sort) - sortValue(b, sort);
    return dir === "asc" ? diff : -diff;
  });

  function sortHref(key: SortKey): string {
    const nextDir = sort === key && dir === "desc" ? "asc" : "desc";
    return `/admin/analytics?period=${period}&periodKey=${periodKey}&sort=${key}&dir=${nextDir}`;
  }

  function sortArrow(key: SortKey): string {
    if (sort !== key) return "";
    return dir === "desc" ? " ↓" : " ↑";
  }

  return (
    <>
      <TopBar label="Admin">
        <AdminNav active="/admin/analytics" />
      </TopBar>

      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-lg font-bold">Análises</h1>
          <form method="GET" className="flex items-center gap-2">
            <PeriodFilterFields period={period} periodKey={periodKey} />
            <Button type="submit" variant="ghost" className="px-3 py-2 text-xs">
              Filtrar
            </Button>
          </form>
        </div>

        <div className="mb-8 flex flex-wrap gap-4">
          <StatTile label="Vendas" value={formatBRL(totals.revenue)} hint={delta(totals.revenue, prevTotals.revenue)} />
          <StatTile
            label="Pedidos"
            value={formatNumberBR(totals.orderCount)}
            hint={delta(totals.orderCount, prevTotals.orderCount)}
          />
          <StatTile label="Ticket médio" value={formatBRL(avgOrderValue)} hint={delta(avgOrderValue, prevAvgOrderValue)} />
          <StatTile
            label="Comissão"
            value={formatBRL(totals.commission)}
            hint={delta(totals.commission, prevTotals.commission)}
          />
          <StatTile
            label="Investimento em envios"
            value={formatBRL(totals.investment)}
            hint={delta(totals.investment, prevTotals.investment)}
          />
          <StatTile
            label="ROI do programa"
            value={programRoi ? `${formatNumberBR(programRoi.ratio, 1)}x` : "—"}
            hint={programRoi ? `${formatPercentBR(programRoi.percent)} de retorno` : "Sem envios registrados no período"}
          />
          <StatTile label="Influenciadores ativos" value={String(activeCount)} />
        </div>

        <Card className="mb-8">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-strike-muted">
            Tendência de vendas — últimos {TREND_POINTS} períodos
          </h2>
          <TrendBarChart points={trendPoints} formatValue={formatBRL} ariaLabel="Tendência de vendas por período" />
        </Card>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <LeaderboardCard
            title="Maior volume de vendas"
            rows={topRevenue}
            renderValue={(r) => formatBRL(r.revenue)}
          />
          <LeaderboardCard
            title="Mais vendas realizadas"
            rows={topOrders}
            renderValue={(r) => `${formatNumberBR(r.orderCount)} pedidos`}
          />
          <LeaderboardCard
            title="Maior comissão ganha"
            rows={topCommission}
            renderValue={(r) => formatBRL(r.commission)}
          />
          <LeaderboardCard
            title="Melhor ROI"
            rows={topRoi}
            renderValue={(r) => `${formatNumberBR(r.roi!.ratio, 1)}x`}
          />
          <LeaderboardCard
            title="Melhor geral"
            rows={topScore}
            renderValue={(r) => `${formatNumberBR(r.score!, 0)} pts`}
            renderDetail={(r) =>
              r.scoreBreakdown
                ? `Receita ${formatNumberBR(r.scoreBreakdown.revenue, 0)} · Pedidos ${formatNumberBR(r.scoreBreakdown.orders, 0)}${
                    r.scoreBreakdown.roi !== null ? ` · ROI ${formatNumberBR(r.scoreBreakdown.roi, 0)}` : ""
                  }${
                    r.scoreBreakdown.conversion !== null
                      ? ` · Conversão ${formatNumberBR(r.scoreBreakdown.conversion, 0)}`
                      : ""
                  }`
                : undefined
            }
          />
        </div>

        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-strike-muted">Todos os influenciadores</h2>
        <div className="overflow-x-auto rounded-lg border border-strike-border bg-strike-white">
          <table className="w-full min-w-[1100px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-strike-border text-left text-xs uppercase tracking-wide text-strike-muted">
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Cupom</th>
                {(
                  [
                    "orderCount",
                    "revenue",
                    "averageOrderValue",
                    "commission",
                    "investment",
                    "roi",
                    "clicks",
                    "conversionRate",
                    "score",
                  ] as SortKey[]
                ).map((key) => (
                  <th key={key} className="px-4 py-3">
                    <Link href={sortHref(key)} className="hover:text-strike-black">
                      {SORT_LABELS[key]}
                      {sortArrow(key)}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedTable.map((row) => (
                <tr key={row.influencerId} className="border-b border-strike-border last:border-0">
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  <td className="px-4 py-3 text-strike-muted">{row.couponCode ?? "—"}</td>
                  <td className="px-4 py-3">{formatNumberBR(row.orderCount)}</td>
                  <td className="px-4 py-3">{formatBRL(row.revenue)}</td>
                  <td className="px-4 py-3">{formatBRL(row.averageOrderValue)}</td>
                  <td className="px-4 py-3 font-semibold">{formatBRL(row.commission)}</td>
                  <td className="px-4 py-3">{formatBRL(row.investment)}</td>
                  <td className="px-4 py-3">{row.roi ? `${formatNumberBR(row.roi.ratio, 1)}x` : "—"}</td>
                  <td className="px-4 py-3">{formatNumberBR(row.clicks)}</td>
                  <td className="px-4 py-3">
                    {row.conversionRate !== null ? formatPercentBR(row.conversionRate * 100, 1) : "—"}
                  </td>
                  <td className="px-4 py-3">{row.score !== null ? formatNumberBR(row.score, 0) : "—"}</td>
                </tr>
              ))}
              {sortedTable.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-strike-muted">
                    Nenhum influenciador ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function LeaderboardCard({
  title,
  rows,
  renderValue,
  renderDetail,
}: {
  title: string;
  rows: InfluencerFullMetrics[];
  renderValue: (row: InfluencerFullMetrics) => string;
  renderDetail?: (row: InfluencerFullMetrics) => string | undefined;
}) {
  return (
    <Card>
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-strike-muted">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-strike-muted">Sem dados no período.</p>
      ) : (
        <ol className="space-y-2">
          {rows.map((row, i) => (
            <li key={row.influencerId} className="flex items-start justify-between gap-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-strike-muted">{i + 1}.</span>
                <div>
                  <div className="font-medium">{row.name}</div>
                  {renderDetail?.(row) && <div className="text-xs text-strike-muted">{renderDetail(row)}</div>}
                </div>
              </div>
              <span className="whitespace-nowrap font-semibold">{renderValue(row)}</span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
