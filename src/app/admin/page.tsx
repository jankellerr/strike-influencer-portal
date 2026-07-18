import Link from "next/link";
import { verifyAdminSession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { EXCLUDED_FROM_REVENUE_STATUSES } from "@/lib/orderStatus";
import { calculateCommission } from "@/lib/commission";
import { getCurrentMonthRangeBrazil } from "@/lib/dateRanges";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui";

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
    <>
      <TopBar label="Admin">
        <form method="POST" action="/api/admin/sync-orders">
          <button
            type="submit"
            className="text-white/70 hover:text-white"
            title="Puxa pedidos anteriores ao mapeamento do cupom, ou perdidos pelo webhook"
          >
            Resincronizar pedidos
          </button>
        </form>
        <Link href="/admin/influencers/new" className="text-strike-yellow hover:brightness-110">
          + Novo influenciador
        </Link>
        <Link href="/admin/videos" className="text-white/70 hover:text-white">
          Vídeos
        </Link>
        <form method="POST" action="/api/admin/logout">
          <button type="submit" className="text-white/70 hover:text-white">
            Sair
          </button>
        </form>
      </TopBar>

      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <h1 className="mb-4 text-lg font-bold">Influenciadores</h1>

        <div className="overflow-x-auto rounded-lg border border-strike-border bg-strike-white">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-strike-border text-left text-xs uppercase tracking-wide text-strike-muted">
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Cupom</th>
                <th className="px-4 py-3">Pedidos</th>
                <th className="px-4 py-3">Vendas</th>
                <th className="px-4 py-3">Comissão (mês atual)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
                <th className="px-4 py-3"></th>
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
                  <tr key={influencer.id} className="border-b border-strike-border last:border-0">
                    <td className="px-4 py-3 font-medium">{influencer.name}</td>
                    <td className="px-4 py-3 text-strike-muted">{influencer.email}</td>
                    <td className="px-4 py-3">{influencer.coupon?.code ?? "—"}</td>
                    <td className="px-4 py-3">{orders.length}</td>
                    <td className="px-4 py-3">{formatBRL(revenue)}</td>
                    <td className="px-4 py-3 font-semibold">{formatBRL(monthCommission)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          influencer.status === "ACTIVE"
                            ? "rounded-full bg-strike-yellow/30 px-2 py-0.5 text-xs font-semibold text-strike-black"
                            : "rounded-full bg-strike-border px-2 py-0.5 text-xs font-semibold text-strike-muted"
                        }
                      >
                        {influencer.status === "ACTIVE" ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/influencers/${influencer.id}/edit`}
                        className="text-strike-black underline decoration-strike-yellow decoration-2 underline-offset-2 hover:text-strike-muted"
                      >
                        Editar
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <form
                        method="POST"
                        action={`/api/admin/influencers/${influencer.id}/toggle-status`}
                      >
                        <Button type="submit" variant="ghost" className="px-2 py-1 text-xs">
                          {influencer.status === "ACTIVE" ? "Desativar" : "Ativar"}
                        </Button>
                      </form>
                    </td>
                  </tr>
                );
              })}
              {influencers.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-strike-muted">
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
