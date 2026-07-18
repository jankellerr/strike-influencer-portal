import { Button, Card, ErrorText, Input, Label, Wordmark } from "@/components/ui";

export default async function InfluencerLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { sent, error } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Wordmark />
          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-strike-muted">
            Portal do influenciador
          </p>
        </div>

        {sent ? (
          <Card>
            <h1 className="mb-2 text-lg font-bold">Verifique seu email</h1>
            <p className="text-sm text-strike-muted">
              Se esse email estiver cadastrado, enviamos um link de acesso. Ele expira em 15
              minutos e só pode ser usado uma vez.
            </p>
          </Card>
        ) : (
          <Card>
            <form method="POST" action="/api/login">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoFocus required className="mb-4" />
              <Label htmlFor="password">Senha (opcional)</Label>
              <Input id="password" name="password" type="password" className="mb-1" />
              <p className="mb-4 text-xs text-strike-muted">
                Deixe em branco para receber um link de acesso por email.
              </p>
              {error === "expired" && (
                <ErrorText>Esse link expirou ou já foi usado. Peça um novo abaixo.</ErrorText>
              )}
              {error === "invalid" && <ErrorText>Email ou senha incorretos.</ErrorText>}
              <Button type="submit" className="w-full">
                Entrar
              </Button>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
