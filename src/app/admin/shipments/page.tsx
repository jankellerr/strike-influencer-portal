import Link from "next/link";
import { verifyAdminSession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { getPeriodRangeBrazil, resolvePeriodParamsBrazil } from "@/lib/dateRanges";
import { formatBRL, formatDateBR } from "@/lib/format";
import { TopBar } from "@/components/TopBar";
import { AdminNav } from "@/components/AdminNav";
import { PeriodFilterFields } from "@/components/PeriodFilterFields";
import { Button, Select, StatTile } from "@/components/ui";

export default async function AdminShipmentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    period?: string;
    periodKey?: string;
    influencerId?: string;
    collectionId?: string;
  }>;
}) {
  await verifyAdminSession();

  const {
    period: periodParam,
    periodKey: periodKeyParam,
    influencerId,
    collectionId,
  } = await searchParams;
  const { period, periodKey } = resolvePeriodParamsBrazil(periodParam, periodKeyParam);
  const { start, end } = getPeriodRangeBrazil(period, periodKey);

  const [influencers, collections, shipments] = await Promise.all([
    prisma.influencer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.collection.findMany({ orderBy: { name: "asc" } }),
    prisma.shipment.findMany({
      where: {
        shippedAt: { gte: start, lt: end },
        ...(influencerId ? { influencerId } : {}),
        ...(collectionId ? { collectionId } : {}),
      },
      orderBy: { shippedAt: "desc" },
      include: {
        influencer: { select: { id: true, name: true } },
        collection: { select: { id: true, name: true } },
        items: { include: { product: { select: { title: true } } } },
      },
    }),
  ]);

  const rows = shipments.map((shipment) => {
    const itemsCost = shipment.items.reduce((sum, item) => sum + item.quantity * Number(item.unitCost), 0);
    const shippingFee = Number(shipment.shippingFee);
    return { shipment, itemsCost, shippingFee, total: itemsCost + shippingFee };
  });

  const totalInvestment = rows.reduce((sum, r) => sum + r.total, 0);
  const distinctInfluencers = new Set(shipments.map((s) => s.influencerId)).size;

  return (
    <>
      <TopBar label="Admin">
        <Link href="/admin/shipments/new" className="text-strike-yellow hover:brightness-110">
          + Novo envio
        </Link>
        <AdminNav active="/admin/shipments" />
      </TopBar>

      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-lg font-bold">Envios</h1>
          <form method="GET" className="flex flex-wrap items-center gap-2">
            <PeriodFilterFields period={period} periodKey={periodKey} />
            <Select name="influencerId" defaultValue={influencerId ?? ""} className="w-auto">
              <option value="">Todos os influenciadores</option>
              {influencers.map((inf) => (
                <option key={inf.id} value={inf.id}>
                  {inf.name}
                </option>
              ))}
            </Select>
            <Select name="collectionId" defaultValue={collectionId ?? ""} className="w-auto">
              <option value="">Todas as coleções</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Button type="submit" variant="ghost" className="px-3 py-2 text-xs">
              Filtrar
            </Button>
          </form>
        </div>

        <div className="mb-8 flex flex-wrap gap-4">
          <StatTile label="Envios no período" value={String(rows.length)} />
          <StatTile label="Investimento total" value={formatBRL(totalInvestment)} />
          <StatTile
            label="Valor médio por envio"
            value={formatBRL(rows.length > 0 ? totalInvestment / rows.length : 0)}
          />
          <StatTile label="Influenciadores atendidos" value={String(distinctInfluencers)} />
        </div>

        <div className="overflow-x-auto rounded-lg border border-strike-border bg-strike-white">
          <table className="w-full min-w-[960px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-strike-border text-left text-xs uppercase tracking-wide text-strike-muted">
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Influenciador</th>
                <th className="px-4 py-3">Coleção</th>
                <th className="px-4 py-3">Itens</th>
                <th className="px-4 py-3">Produtos</th>
                <th className="px-4 py-3">Frete</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3"></th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ shipment, itemsCost, shippingFee, total }) => (
                <tr key={shipment.id} className="border-b border-strike-border last:border-0 align-top">
                  <td className="px-4 py-3 whitespace-nowrap">{formatDateBR(shipment.shippedAt)}</td>
                  <td className="px-4 py-3 font-medium">{shipment.influencer.name}</td>
                  <td className="px-4 py-3 text-strike-muted">{shipment.collection?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-strike-muted">
                    {shipment.items.map((item) => `${item.quantity}× ${item.product.title}`).join(", ")}
                  </td>
                  <td className="px-4 py-3">{formatBRL(itemsCost)}</td>
                  <td className="px-4 py-3">{formatBRL(shippingFee)}</td>
                  <td className="px-4 py-3 font-semibold">{formatBRL(total)}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/shipments/${shipment.id}/edit`}
                      className="text-strike-black underline decoration-strike-yellow decoration-2 underline-offset-2 hover:text-strike-muted"
                    >
                      Editar
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <form method="POST" action={`/api/admin/shipments/${shipment.id}/delete`}>
                      <Button type="submit" variant="ghost" className="px-2 py-1 text-xs">
                        Excluir
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-strike-muted">
                    Nenhum envio no período selecionado.
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
