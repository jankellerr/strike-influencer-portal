import Link from "next/link";
import { verifyInfluencerSession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { TopBar } from "@/components/TopBar";
import { Button, ErrorText, Label, Select } from "@/components/ui";

export default async function InfluencerLinksPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await verifyInfluencerSession();
  const { error } = await searchParams;

  const [products, links] = await Promise.all([
    prisma.product.findMany({ orderBy: { title: "asc" } }),
    prisma.utmLink.findMany({
      where: { influencerId: session.influencerId },
      orderBy: { createdAt: "desc" },
      include: { product: true, _count: { select: { clickEvents: true } } },
    }),
  ]);

  const appBaseUrl = process.env.APP_BASE_URL ?? "";

  return (
    <>
      <TopBar label="Links de produtos">
        <Link href="/dashboard" className="text-strike-yellow hover:brightness-110">
          ← Voltar ao painel
        </Link>
      </TopBar>

      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <h1 className="mb-6 text-2xl font-bold">Seus links de produtos</h1>

        <form
          method="POST"
          action="/api/dashboard/links"
          className="mb-2 flex flex-wrap items-end gap-3"
        >
          <div className="min-w-[240px] flex-1">
            <Label htmlFor="productId">Produto</Label>
            <Select id="productId" name="productId" required>
              <option value="">Selecione um produto…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit">Gerar link</Button>
        </form>
        {error && <ErrorText>Não foi possível gerar o link. Tente novamente.</ErrorText>}

        <div className="mt-6 overflow-x-auto rounded-lg border border-strike-border bg-strike-white">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-strike-border text-left text-xs uppercase tracking-wide text-strike-muted">
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Link</th>
                <th className="px-4 py-3">Cliques</th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => {
                const shortUrl = `${appBaseUrl}/l/${link.slug}`;
                return (
                  <tr key={link.id} className="border-b border-strike-border last:border-0">
                    <td className="px-4 py-3">{link.product.title}</td>
                    <td className="px-4 py-3">
                      <a
                        href={shortUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-strike-black underline decoration-strike-yellow decoration-2 underline-offset-2 hover:text-strike-muted"
                      >
                        {shortUrl}
                      </a>
                    </td>
                    <td className="px-4 py-3 font-medium">{link._count.clickEvents}</td>
                  </tr>
                );
              })}
              {links.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-strike-muted">
                    Nenhum link criado ainda.
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
