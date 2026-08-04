import Link from "next/link";
import { verifyAdminSession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { formatDateKeyBrazil } from "@/lib/dateRanges";
import { TopBar } from "@/components/TopBar";
import { ShipmentItemsFields } from "@/components/ShipmentItemsFields";
import { Button, Card, ErrorText, Input, Label, Select, Textarea } from "@/components/ui";

export default async function NewShipmentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await verifyAdminSession();
  const { error } = await searchParams;

  const [influencers, collections, products] = await Promise.all([
    prisma.influencer.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.collection.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true, costPerItem: true } }),
  ]);

  return (
    <>
      <TopBar label="Admin">
        <Link href="/admin/shipments" className="text-white/70 hover:text-white">
          ← Voltar
        </Link>
      </TopBar>

      <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
        <h1 className="mb-4 text-lg font-bold">Novo envio</h1>
        <Card>
          <form method="POST" action="/api/admin/shipments">
            <Label htmlFor="influencerId">Influenciador</Label>
            <Select id="influencerId" name="influencerId" required className="mb-4">
              <option value="">Selecione…</option>
              {influencers.map((inf) => (
                <option key={inf.id} value={inf.id}>
                  {inf.name}
                </option>
              ))}
            </Select>

            <div className="mb-4 flex gap-2">
              <div className="flex-1">
                <Label htmlFor="collectionId">Coleção</Label>
                <Select id="collectionId" name="collectionId" className="w-full">
                  <option value="">Nenhuma / nova abaixo</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex-1">
                <Label htmlFor="newCollectionName">Ou nova coleção</Label>
                <Input id="newCollectionName" name="newCollectionName" placeholder="ex.: Drop de Verão" />
              </div>
            </div>

            <div className="mb-4 flex gap-2">
              <div className="flex-1">
                <Label htmlFor="shippedAt">Data do envio</Label>
                <Input
                  id="shippedAt"
                  name="shippedAt"
                  type="date"
                  required
                  defaultValue={formatDateKeyBrazil(new Date())}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="shippingFee">Frete (R$)</Label>
                <Input id="shippingFee" name="shippingFee" type="number" min={0} step="0.01" defaultValue="0" required />
              </div>
            </div>

            <div className="mb-4">
              <ShipmentItemsFields
                products={products.map((p) => ({ id: p.id, title: p.title, costPerItem: p.costPerItem ? Number(p.costPerItem) : null }))}
              />
            </div>

            <Label htmlFor="note">Observação (opcional)</Label>
            <Textarea id="note" name="note" rows={2} className="mb-4" />

            {error && <ErrorText>Algo deu errado. Confira os campos e tente novamente.</ErrorText>}

            <Button type="submit" className="w-full">
              Registrar envio
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
