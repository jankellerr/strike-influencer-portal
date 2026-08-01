import Link from "next/link";
import { verifyAdminSession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { EXCLUDED_FROM_REVENUE_STATUSES } from "@/lib/orderStatus";
import { calculateCommission } from "@/lib/commission";
import {
  getCurrentMonthKeyBrazil,
  getMonthRangeBrazil,
  getRecentMonthOptionsBrazil,
  isValidMonthKey,
} from "@/lib/dateRanges";
import { TopBar } from "@/components/TopBar";
import { Button, Select } from "@/components/ui";

const MONTH_OPTIONS_COUNT = 12;

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  await verifyAdminSession();

  const { month: requestedMonth } = await searchParams;
  const selectedMonth =
    requestedMonth && isValidMonthKey(requestedMonth) ? requestedMonth : getCurrentMonthKeyBrazil();
  const { start: monthStart, end: monthEnd } = getMonthRangeBrazil(selectedMonth);
  const monthOptions = getRecentMonthOptionsBrazil(MONTH_OPTIONS_COUNT);

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
      commissionPayments: { where: { month: selectedMonth } },
    },
  });

  const rows = influencers.map((influencer) => {
    const orders = influencer.coupon?.orders ?? [];
    const monthOrders = orders.filter((o) => o.orderedAt >= monthStart && o.orderedAt < monthEnd);
    const monthRevenue = monthOrders.reduce((sum, o) => sum + Number(o.valueTotal), 0);
    const monthProductValue = monthOrders.reduce((sum, o) => sum + Number(o.valueProducts ?? 0), 0);
    const monthCommission = calculateCommission(monthProductValue);
    const isPaid = influencer.commissionPayments[0]?.paid ?? false;
    return { influencer, monthRevenue, monthOrderCount: monthOrders.length, monthCommission, isPaid };
  });
  const totalMonthCommission = rows.reduce((sum, r) => sum + r.monthCommission, 0);
  const unpaidCount = rows.filter((r) => !r.isPaid).length;
  const selectedMonthLabel =
    monthOptions.find((o) => o.key === selectedMonth)?.label ?? selectedMonth;

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

      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-lg font-bold">Influenciadores</h1>

          <form method="GET" className="flex items-center gap-2">
            <Select name="month" defaultValue={selectedMonth} className="w-auto">
              {monthOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Button type="submit" variant="ghost" className="px-3 py-2 text-xs">
              Filtrar
            </Button>
          </form>
        </div>

        <div className="overflow-x-auto rounded-lg border border-strike-border bg-strike-white">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-strike-border text-left text-xs uppercase tracking-wide text-strike-muted">
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Cupom</th>
                <th className="px-4 py-3">Pedidos</th>
                <th className="px-4 py-3">Vendas ({selectedMonthLabel})</th>
                <th className="px-4 py-3">Comissão ({selectedMonthLabel})</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Pagamento</th>
                <th className="px-4 py-3"></th>
                <th className="px-4 py-3"></th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ influencer, monthRevenue, monthOrderCount, monthCommission, isPaid }) => (
                <tr key={influencer.id} className="border-b border-strike-border last:border-0">
                  <td className="px-4 py-3 font-medium">{influencer.name}</td>
                  <td className="px-4 py-3 text-strike-muted">{influencer.email}</td>
                  <td className="px-4 py-3">{influencer.coupon?.code ?? "—"}</td>
                  <td className="px-4 py-3">{monthOrderCount}</td>
                  <td className="px-4 py-3">{formatBRL(monthRevenue)}</td>
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
                    <span
                      className={
                        isPaid
                          ? "rounded-full bg-strike-yellow/30 px-2 py-0.5 text-xs font-semibold text-strike-black"
                          : "rounded-full bg-strike-border px-2 py-0.5 text-xs font-semibold text-strike-muted"
                      }
                    >
                      {isPaid ? "Pago" : "Pendente"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <form
                      method="POST"
                      action={`/api/admin/influencers/${influencer.id}/commission-payment`}
                    >
                      <input type="hidden" name="month" value={selectedMonth} />
                      <Button type="submit" variant="ghost" className="whitespace-nowrap px-2 py-1 text-xs">
                        {isPaid ? "Desfazer" : "Marcar pago"}
                      </Button>
                    </form>
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
              ))}
              {influencers.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-strike-muted">
                    Nenhum influenciador ainda.
                  </td>
                </tr>
              )}
            </tbody>
            {influencers.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-strike-border bg-strike-black/[0.03] font-semibold">
                  <td className="px-4 py-3" colSpan={5}>
                    Total a pagar em {selectedMonthLabel}
                    {unpaidCount > 0 && (
                      <span className="ml-2 font-normal text-strike-muted">
                        ({unpaidCount} pendente{unpaidCount > 1 ? "s" : ""})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{formatBRL(totalMonthCommission)}</td>
                  <td className="px-4 py-3" colSpan={5}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </>
  );
}
