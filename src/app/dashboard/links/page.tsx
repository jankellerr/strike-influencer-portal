import Link from "next/link";
import { verifyInfluencerSession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

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
    <div style={{ maxWidth: 900, margin: "40px auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 20 }}>Seus links de produtos</h1>
        <Link href="/dashboard">← Voltar ao painel</Link>
      </div>

      <form
        method="POST"
        action="/api/dashboard/links"
        style={{ display: "flex", gap: 8, alignItems: "end", margin: "24px 0" }}
      >
        <div style={{ flex: 1 }}>
          <label htmlFor="productId" style={{ display: "block", fontSize: 12, color: "#666" }}>
            Produto
          </label>
          <select id="productId" name="productId" required style={{ width: "100%", padding: 8 }}>
            <option value="">Selecione um produto…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" style={{ padding: 8 }}>
          Gerar link
        </button>
      </form>
      {error && (
        <p style={{ color: "#b91c1c", fontSize: 14, marginBottom: 12 }}>
          Não foi possível gerar o link. Tente novamente.
        </p>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: 8 }}>Produto</th>
            <th style={{ padding: 8 }}>Link</th>
            <th style={{ padding: 8 }}>Cliques</th>
          </tr>
        </thead>
        <tbody>
          {links.map((link) => {
            const shortUrl = `${appBaseUrl}/l/${link.slug}`;
            return (
              <tr key={link.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 8 }}>{link.product.title}</td>
                <td style={{ padding: 8 }}>
                  <a href={shortUrl} target="_blank" rel="noreferrer">
                    {shortUrl}
                  </a>
                </td>
                <td style={{ padding: 8 }}>{link._count.clickEvents}</td>
              </tr>
            );
          })}
          {links.length === 0 && (
            <tr>
              <td colSpan={3} style={{ padding: 16, color: "#666" }}>
                Nenhum link criado ainda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
