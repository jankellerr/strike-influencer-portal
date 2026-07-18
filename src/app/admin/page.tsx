import Link from "next/link";
import { verifyAdminSession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { EXCLUDED_FROM_REVENUE_STATUSES } from "@/lib/orderStatus";
import { calculateCommission } from "@/lib/commission";
import { getCurrentMonthRangeBrazil } from "@/lib/dateRanges";

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function AdminDashboardPage() {
  await verifyAdminSession();

  const { start: monthStart, end: monthEnd } = getCurrentMonthRangeBrazil();

  const influencers = await prisma.influencer.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      coupon: {
        include: {
          orders: {
            where: { status: { notIn: EXCLUDED_FROM_REVENUE_STATUSES } },
            select: { valueTotal: true, valueProducts: true, orderedAt: true },
          },
        },
      },
    },
  });

  return (
    <div style={{ maxWidth: 1000, margin: "40px auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 20 }}>Influencers</h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <form method="POST" action="/api/admin/sync-orders">
            <button type="submit" title="Pull in any orders placed before a coupon was mapped, or missed by the webhook">
              Resync orders
            </button>
          </form>
          <Link href="/admin/influencers/new">+ New influencer</Link>
          <form method="POST" action="/api/admin/logout">
            <button type="submit">Log out</button>
          </form>
        </div>
      </div>

      <table style={{ width: "100%", marginTop: 24, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: 8 }}>Name</th>
            <th style={{ padding: 8 }}>Email</th>
            <th style={{ padding: 8 }}>Coupon</th>
            <th style={{ padding: 8 }}>Orders</th>
            <th style={{ padding: 8 }}>Revenue</th>
            <th style={{ padding: 8 }}>Commission (this month)</th>
            <th style={{ padding: 8 }}>Status</th>
            <th style={{ padding: 8 }}></th>
          </tr>
        </thead>
        <tbody>
          {influencers.map((influencer) => {
            const orders = influencer.coupon?.orders ?? [];
            const revenue = orders.reduce((sum, o) => sum + Number(o.valueTotal), 0);
            const monthProductValue = orders
              .filter((o) => o.orderedAt >= monthStart && o.orderedAt < monthEnd)
              .reduce((sum, o) => sum + Number(o.valueProducts ?? 0), 0);
            const monthCommission = calculateCommission(monthProductValue);
            return (
              <tr key={influencer.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 8 }}>{influencer.name}</td>
                <td style={{ padding: 8 }}>{influencer.email}</td>
                <td style={{ padding: 8 }}>{influencer.coupon?.code ?? "—"}</td>
                <td style={{ padding: 8 }}>{orders.length}</td>
                <td style={{ padding: 8 }}>{formatBRL(revenue)}</td>
                <td style={{ padding: 8 }}>{formatBRL(monthCommission)}</td>
                <td style={{ padding: 8 }}>{influencer.status}</td>
                <td style={{ padding: 8 }}>
                  <form method="POST" action={`/api/admin/influencers/${influencer.id}/toggle-status`}>
                    <button type="submit">
                      {influencer.status === "ACTIVE" ? "Deactivate" : "Activate"}
                    </button>
                  </form>
                </td>
              </tr>
            );
          })}
          {influencers.length === 0 && (
            <tr>
              <td colSpan={8} style={{ padding: 16, color: "#666" }}>
                No influencers yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
