import Link from "next/link";
import { verifyInfluencerSession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { countsAsRevenue, statusLabelPt } from "@/lib/orderStatus";
import { calculateCommission, COMMISSION_RATE } from "@/lib/commission";
import { formatDateKeyBrazil, getCurrentMonthKeyBrazil, getCurrentMonthRangeBrazil } from "@/lib/dateRanges";
import { TopBar } from "@/components/TopBar";
import { Button, Input, Label, StatTile } from "@/components/ui";

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR");
}

export default async function InfluencerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await verifyInfluencerSession();
  const { from, to } = await searchParams;

  const influencer = await prisma.influencer.findUniqueOrThrow({
    where: { id: session.influencerId },
    include: { coupon: true },
  });

  const { start: monthStart, end: monthEnd } = getCurrentMonthRangeBrazil();
  const defaultFrom = formatDateKeyBrazil(monthStart);
  const defaultTo = formatDateKeyBrazil(new Date(monthEnd.getTime() - 1));

  // Before the influencer applies any filter of their own, default to the
  // current month rather than showing all-time totals.
  const effectiveFrom = from ?? defaultFrom;
  const effectiveTo = to ?? defaultTo;

  const fromDate = effectiveFrom ? new Date(`${effectiveFrom}T00:00:00-03:00`) : null;
  const toDate = effectiveTo ? new Date(`${effectiveTo}T23:59:59-03:00`) : null;

  const orders = influencer.coupon
    ? await prisma.order.findMany({
        where: {
          couponId: influencer.coupon.id,
          ...(fromDate || toDate
            ? {
                orderedAt: {
                  ...(fromDate ? { gte: fromDate } : {}),
                  ...(toDate ? { lte: toDate } : {}),
                },
              }
            : {}),
        },
        orderBy: { orderedAt: "desc" },
      })
    : [];

  const revenueOrders = orders.filter((o) => countsAsRevenue(o.status));
  const revenue = revenueOrders.reduce((sum, o) => sum + Number(o.valueTotal), 0);
  const productValue = revenueOrders.reduce((sum, o) => sum + Number(o.valueProducts ?? 0), 0);
  const discountGiven = revenueOrders.reduce((sum, o) => sum + Number(o.valueDiscount), 0);
  const aov = revenueOrders.length > 0 ? revenue / revenueOrders.length : 0;
  const commission = calculateCommission(productValue);

  const monthOrders = influencer.coupon
    ? await prisma.order.findMany({
        where: {
          couponId: influencer.coupon.id,
          orderedAt: { gte: monthStart, lt: monthEnd },
        },
        select: { status: true, valueProducts: true },
      })
    : [];
  const monthProductValue = monthOrders
    .filter((o) => countsAsRevenue(o.status))
    .reduce((sum, o) => sum + Number(o.valueProducts ?? 0), 0);
  const monthCommission = calculateCommission(monthProductValue);
  const monthName = monthStart.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const currentMonthPayment = await prisma.commissionPayment.findUnique({
    where: {
      influencerId_month: { influencerId: session.influencerId, month: getCurrentMonthKeyBrazil() },
    },
  });
  const isCommissionPaid = currentMonthPayment?.paid ?? false;

  const totalClicks = await prisma.clickEvent.count({
    where: { utmLink: { influencerId: session.influencerId } },
  });

  return (
    <>
      <TopBar>
        <Link href="/dashboard/links" className="text-strike-yellow hover:brightness-110">
          Meus links de produtos
        </Link>
        <Link href="/dashboard/videos" className="text-white/70 hover:text-white">
          Como usar
        </Link>
        <Link href="/dashboard/security" className="text-white/70 hover:text-white">
          Senha
        </Link>
        <form method="POST" action="/api/logout">
          <button type="submit" className="text-white/70 hover:text-white">
            Sair
          </button>
        </form>
      </TopBar>

      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <h1 className="mb-1 text-2xl font-bold">Olá, {influencer.name}</h1>
        <p className="mb-6 text-sm text-strike-muted">
          Cupom: <span className="font-semibold text-strike-black">{influencer.coupon?.code ?? "—"}</span>
        </p>

        <div className="mb-8 rounded-lg bg-strike-black p-6 text-strike-white">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-medium uppercase tracking-wide text-white/60 capitalize">
              Sua comissão em {monthName}
            </div>
            <span
              className={
                isCommissionPaid
                  ? "rounded-full bg-strike-yellow/30 px-2 py-0.5 text-xs font-semibold text-strike-yellow"
                  : "rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-white/60"
              }
            >
              {isCommissionPaid ? "Pago" : "Pagamento pendente"}
            </span>
          </div>
          <div className="mt-1 text-4xl font-black text-strike-yellow">
            {formatBRL(monthCommission)}
          </div>
          <div className="mt-2 text-xs text-white/60">
            {(COMMISSION_RATE * 100).toFixed(0)}% sobre {formatBRL(monthProductValue)} em produtos
            vendidos — frete, impostos e parcelamento não entram na conta
          </div>
        </div>

        <form method="GET" className="mb-6 flex flex-wrap items-end gap-3">
          <div>
            <Label htmlFor="from">De</Label>
            <Input id="from" name="from" type="date" defaultValue={effectiveFrom} className="w-auto" />
          </div>
          <div>
            <Label htmlFor="to">Até</Label>
            <Input id="to" name="to" type="date" defaultValue={effectiveTo} className="w-auto" />
          </div>
          <Button type="submit" variant="ghost">
            Filtrar
          </Button>
          {(from || to) && (
            <a href="/dashboard" className="text-sm text-strike-muted underline">
              Limpar
            </a>
          )}
        </form>

        <div className="mb-8 flex flex-wrap gap-4">
          <StatTile label="Comissão (período filtrado)" value={formatBRL(commission)} />
          <StatTile label="Vendas (total do pedido)" value={formatBRL(revenue)} />
          <StatTile label="Pedidos" value={String(revenueOrders.length)} />
          <StatTile label="Ticket médio" value={formatBRL(aov)} />
          <StatTile label="Desconto concedido" value={formatBRL(discountGiven)} />
          <StatTile label="Cliques nos links" value={String(totalClicks)} />
        </div>

        <div className="overflow-x-auto rounded-lg border border-strike-border bg-strike-white">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-strike-border text-left text-xs uppercase tracking-wide text-strike-muted">
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Valor dos produtos</th>
                <th className="px-4 py-3">Comissão</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-strike-border last:border-0">
                  <td className="px-4 py-3">{formatDate(order.orderedAt)}</td>
                  <td className="px-4 py-3">{statusLabelPt(order.status)}</td>
                  <td className="px-4 py-3">{formatBRL(Number(order.valueProducts ?? 0))}</td>
                  <td className="px-4 py-3 font-medium">
                    {countsAsRevenue(order.status)
                      ? formatBRL(calculateCommission(Number(order.valueProducts ?? 0)))
                      : "—"}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-strike-muted">
                    Nenhum pedido neste período.
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
