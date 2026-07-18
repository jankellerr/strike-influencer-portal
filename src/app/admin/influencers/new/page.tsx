import Link from "next/link";
import { verifyAdminSession } from "@/lib/dal";
import { listUnmappedActivePromocodes } from "@/lib/yampi/listUnmappedPromocodes";
import { TopBar } from "@/components/TopBar";
import { Button, Card, ErrorText, Input, Label, Select } from "@/components/ui";

export default async function NewInfluencerPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await verifyAdminSession();
  const { error } = await searchParams;
  const promocodes = await listUnmappedActivePromocodes();

  return (
    <>
      <TopBar label="Admin">
        <Link href="/admin" className="text-white/70 hover:text-white">
          ← Voltar
        </Link>
      </TopBar>

      <div className="mx-auto w-full max-w-md flex-1 px-6 py-8">
        <h1 className="mb-4 text-lg font-bold">Novo influenciador</h1>
        <Card>
          <form method="POST" action="/api/admin/influencers">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" required className="mb-4" />

            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required className="mb-4" />

            <Label htmlFor="yampiPromoId">Cupom Yampi</Label>
            <Select id="yampiPromoId" name="yampiPromoId" required className="mb-1">
              <option value="">Selecione um cupom…</option>
              {promocodes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} ({p.discount_type} {p.value})
                </option>
              ))}
            </Select>
            {promocodes.length === 0 && (
              <p className="mb-4 text-sm text-strike-muted">
                Nenhum cupom ativo sem influenciador encontrado na Yampi. Crie um lá primeiro.
              </p>
            )}

            {error && (
              <ErrorText>
                {error === "coupon_taken"
                  ? "Esse cupom acabou de ser vinculado a outro influenciador. Escolha outro."
                  : error === "email_taken"
                    ? "Já existe um influenciador com esse email."
                    : "Algo deu errado. Confira os campos e tente novamente."}
              </ErrorText>
            )}

            <Button type="submit" className="mt-3 w-full">
              Criar influenciador
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
