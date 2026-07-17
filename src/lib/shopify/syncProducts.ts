import { prisma } from "@/lib/prisma";
import { listAllProducts } from "@/lib/shopify/client";

export async function syncProducts(): Promise<{ upserted: number; skipped: number }> {
  const products = await listAllProducts();
  let upserted = 0;
  let skipped = 0;

  for (const product of products) {
    // A product not published to the Online Store channel has no onlineStoreUrl —
    // skip it since there's nowhere for a UTM link to point.
    if (!product.onlineStoreUrl) {
      skipped += 1;
      continue;
    }

    await prisma.product.upsert({
      where: { shopifyGid: product.id },
      create: {
        shopifyGid: product.id,
        handle: product.handle,
        title: product.title,
        imageUrl: product.featuredImage?.url ?? null,
        onlineStoreUrl: product.onlineStoreUrl,
      },
      update: {
        handle: product.handle,
        title: product.title,
        imageUrl: product.featuredImage?.url ?? null,
        onlineStoreUrl: product.onlineStoreUrl,
        syncedAt: new Date(),
      },
    });
    upserted += 1;
  }

  return { upserted, skipped };
}
