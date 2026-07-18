import Link from "next/link";
import { notFound } from "next/navigation";
import { verifyAdminSession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { BRAZIL_STATES, SHIRT_SIZES } from "@/lib/brazilStates";
import { TopBar } from "@/components/TopBar";
import { Button, Card, ErrorText, Input, Label, Select } from "@/components/ui";

export default async function EditInfluencerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await verifyAdminSession();
  const { id } = await params;
  const { error } = await searchParams;

  const influencer = await prisma.influencer.findUnique({ where: { id } });
  if (!influencer) notFound();

  return (
    <>
      <TopBar label="Admin">
        <Link href="/admin" className="text-white/70 hover:text-white">
          ← Voltar
        </Link>
      </TopBar>

      <div className="mx-auto w-full max-w-md flex-1 px-6 py-8">
        <h1 className="mb-4 text-lg font-bold">Detalhes de {influencer.name}</h1>
        <Card>
          <form method="POST" action={`/api/admin/influencers/${influencer.id}/update`}>
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" required defaultValue={influencer.name} className="mb-4" />

            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={influencer.email}
              className="mb-4"
            />

            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={influencer.phone ?? ""}
              placeholder="(11) 91234-5678"
              className="mb-4"
            />

            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              name="cpf"
              defaultValue={influencer.cpf ?? ""}
              placeholder="000.000.000-00"
              className="mb-4"
            />

            <Label htmlFor="shirtSize">Tamanho de camiseta</Label>
            <Select id="shirtSize" name="shirtSize" defaultValue={influencer.shirtSize ?? ""} className="mb-4">
              <option value="">Selecione…</option>
              {SHIRT_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </Select>

            <Label htmlFor="addressStreet">Endereço</Label>
            <Input
              id="addressStreet"
              name="addressStreet"
              defaultValue={influencer.addressStreet ?? ""}
              placeholder="Rua / Avenida"
              className="mb-2"
            />
            <div className="mb-4 flex gap-2">
              <Input
                name="addressNumber"
                defaultValue={influencer.addressNumber ?? ""}
                placeholder="Número"
                className="w-24"
              />
              <Input
                name="addressNeighborhood"
                defaultValue={influencer.addressNeighborhood ?? ""}
                placeholder="Bairro"
                className="flex-1"
              />
            </div>
            <div className="mb-4 flex gap-2">
              <Input
                name="addressCity"
                defaultValue={influencer.addressCity ?? ""}
                placeholder="Cidade"
                className="flex-1"
              />
              <Select name="addressState" defaultValue={influencer.addressState ?? ""} className="w-28">
                <option value="">UF</option>
                {BRAZIL_STATES.map(([uf]) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </Select>
            </div>
            <Label htmlFor="addressZip">CEP</Label>
            <Input
              id="addressZip"
              name="addressZip"
              defaultValue={influencer.addressZip ?? ""}
              placeholder="00000-000"
              className="mb-4"
            />

            {error && (
              <ErrorText>
                {error === "email_taken"
                  ? "Já existe um influenciador com esse email."
                  : "Algo deu errado. Confira os campos e tente novamente."}
              </ErrorText>
            )}

            <Button type="submit" className="w-full">
              Salvar
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
