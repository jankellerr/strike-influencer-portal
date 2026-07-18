import Link from "next/link";
import { verifyInfluencerSession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { TopBar } from "@/components/TopBar";
import { Button, Card, ErrorText, Input, Label } from "@/components/ui";

export default async function InfluencerSecurityPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const session = await verifyInfluencerSession();
  const { error, success } = await searchParams;

  const influencer = await prisma.influencer.findUniqueOrThrow({
    where: { id: session.influencerId },
    select: { passwordHash: true },
  });

  return (
    <>
      <TopBar label="Senha">
        <Link href="/dashboard" className="text-strike-yellow hover:brightness-110">
          ← Voltar ao painel
        </Link>
      </TopBar>

      <div className="mx-auto w-full max-w-sm flex-1 px-6 py-8">
        <h1 className="mb-1 text-2xl font-bold">
          {influencer.passwordHash ? "Alterar senha" : "Criar senha"}
        </h1>
        <p className="mb-6 text-sm text-strike-muted">
          Defina uma senha para entrar direto, sem precisar do link por email. O login por email
          continua funcionando normalmente.
        </p>

        <Card>
          <form method="POST" action="/api/dashboard/security">
            <Label htmlFor="password">Nova senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoFocus
              required
              minLength={8}
              className="mb-4"
            />
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              className="mb-4"
            />
            {error === "mismatch" && <ErrorText>As senhas não coincidem.</ErrorText>}
            {error === "short" && <ErrorText>A senha precisa ter pelo menos 8 caracteres.</ErrorText>}
            {success === "1" && (
              <p className="mb-3 text-sm font-medium text-strike-black">Senha salva com sucesso.</p>
            )}
            <Button type="submit" className="w-full">
              Salvar senha
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
