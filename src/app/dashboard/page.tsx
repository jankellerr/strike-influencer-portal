import Link from "next/link";
import { verifyInfluencerSession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { countsAsRevenue } from "@/lib/orderStatus";
import { calculateCommission, COMMISSION_RATE } from "@/lib/commission";
import { getCurrentMonthRangeBrazil } from "@/lib/dateRanges";

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

  const fromDate = from ? new Date(`${from}T00:00:00-03:00`) : null;
  const toDate = to ? new Date(`${to}T23:59:59-03:00`) : null;

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

  const { start: monthStart, end: monthEnd } = getCurrentMonthRangeBrazil();
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

  const totalClicks = await prisma.clickEvent.count({
    where: { utmLink: { influencerId: session.influencerId } },
  });

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 20, marginBottom: 4 }}>Olá, {influencer.name}</h1>
          <p style={{ color: "#666", fontSize: 14 }}>
            Seu cupom: <strong>{influencer.coupon?.code ?? "—"}</strong>
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link href="/dashboard/links">Meus links de produtos</Link>
          <form method="POST" action="/api/logout">
            <button type="submit">Sair</button>
          </form>
        </div>
      </div>

      <div
        style={{
          background: "#111",
          color: "#fff",
          borderRadius: 8,
          padding: 20,
          margin: "24px 0",
        }}
      >
        <div style={{ fontSize: 12, color: "#bbb", textTransform: "capitalize" }}>
          Sua comissão em {monthName}
        </div>
        <div style={{ fontSize: 32, fontWeight: 700 }}>{formatBRL(monthCommission)}</div>
        <div style={{ fontSize: 12, color: "#bbb", marginTop: 4 }}>
          {(COMMISSION_RATE * 100).toFixed(0)}% sobre {formatBRL(monthProductValue)} em produtos
          vendidos (frete, impostos e parcelamento não entram na conta)
        </div>
      </div>

      <form method="GET" style={{ display: "flex", gap: 8, alignItems: "end", margin: "24px 0" }}>
        <div>
          <label htmlFor="from" style={{ display: "block", fontSize: 12, color: "#666" }}>
            De
          </label>
          <input id="from" name="from" type="date" defaultValue={from} />
        </div>
        <div>
          <label htmlFor="to" style={{ display: "block", fontSize: 12, color: "#666" }}>
            Até
          </label>
          <input id="to" name="to" type="date" defaultValue={to} />
        </div>
        <button type="submit">Filtrar</button>
        {(from || to) && <a href="/dashboard">Limpar</a>}
      </form>

      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 16, flex: 1 }}>
          <div style={{ fontSize: 12, color: "#666" }}>Comissão (período filtrado)</div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>{formatBRL(commission)}</div>
        </div>
        <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 16, flex: 1 }}>
          <div style={{ fontSize: 12, color: "#666" }}>Vendas (total do pedido)</div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>{formatBRL(revenue)}</div>
        </div>
        <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 16, flex: 1 }}>
          <div style={{ fontSize: 12, color: "#666" }}>Pedidos</div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>{revenueOrders.length}</div>
        </div>
        <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 16, flex: 1 }}>
          <div style={{ fontSize: 12, color: "#666" }}>Ticket médio</div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>{formatBRL(aov)}</div>
        </div>
        <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 16, flex: 1 }}>
          <div style={{ fontSize: 12, color: "#666" }}>Desconto concedido</div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>{formatBRL(discountGiven)}</div>
        </div>
        <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 16, flex: 1 }}>
          <div style={{ fontSize: 12, color: "#666" }}>Cliques nos links (total)</div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>{totalClicks}</div>
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: 8 }}>Data</th>
            <th style={{ padding: 8 }}>Status</th>
            <th style={{ padding: 8 }}>Valor dos produtos</th>
            <th style={{ padding: 8 }}>Comissão</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 8 }}>{formatDate(order.orderedAt)}</td>
              <td style={{ padding: 8 }}>{order.status}</td>
              <td style={{ padding: 8 }}>{formatBRL(Number(order.valueProducts ?? 0))}</td>
              <td style={{ padding: 8 }}>
                {countsAsRevenue(order.status)
                  ? formatBRL(calculateCommission(Number(order.valueProducts ?? 0)))
                  : "—"}
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={4} style={{ padding: 16, color: "#666" }}>
                Nenhum pedido neste período.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
