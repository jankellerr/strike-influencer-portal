import { Button, Card, ErrorText, Input, Label, Wordmark } from "@/components/ui";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Wordmark />
          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-strike-muted">
            Painel administrativo
          </p>
        </div>
        <Card>
          <form method="POST" action="/api/admin/login">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoFocus
              required
              className="mb-4"
            />
            {error && <ErrorText>Senha incorreta.</ErrorText>}
            <Button type="submit" className="w-full">
              Entrar
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
