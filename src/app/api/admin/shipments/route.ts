import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminSession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

const emptyToUndefined = (val: unknown) => (val === "" ? undefined : val);

const ShipmentFieldsSchema = z.object({
  influencerId: z.string().trim().min(1),
  collectionId: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  newCollectionName: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  shippedAt: z.string().trim().min(1),
  shippingFee: z.coerce.number().min(0),
  note: z.preprocess(emptyToUndefined, z.string().trim().optional()),
});

const ItemSchema = z.object({
  productId: z.string().trim().min(1),
  quantity: z.coerce.number().int().min(1),
  unitCost: z.coerce.number().min(0),
});

function parseItems(formData: FormData) {
  const productIds = formData.getAll("productId[]");
  const quantities = formData.getAll("quantity[]");
  const unitCosts = formData.getAll("unitCost[]");
  return z
    .array(ItemSchema)
    .min(1)
    .safeParse(productIds.map((productId, i) => ({ productId, quantity: quantities[i], unitCost: unitCosts[i] })));
}

export async function POST(request: NextRequest) {
  await verifyAdminSession();
  const formData = await request.formData();

  const fieldsParsed = ShipmentFieldsSchema.safeParse(Object.fromEntries(formData));
  const itemsParsed = parseItems(formData);

  if (!fieldsParsed.success || !itemsParsed.success) {
    return NextResponse.redirect(new URL("/admin/shipments/new?error=invalid", request.url), 303);
  }

  const { influencerId, collectionId, newCollectionName, shippedAt, shippingFee, note } = fieldsParsed.data;

  let resolvedCollectionId = collectionId;
  if (newCollectionName) {
    const collection = await prisma.collection.upsert({
      where: { name: newCollectionName },
      create: { name: newCollectionName },
      update: {},
    });
    resolvedCollectionId = collection.id;
  }

  await prisma.shipment.create({
    data: {
      influencerId,
      collectionId: resolvedCollectionId,
      shippedAt: new Date(`${shippedAt}T12:00:00-03:00`),
      shippingFee,
      note,
      items: { create: itemsParsed.data },
    },
  });

  return NextResponse.redirect(new URL("/admin/shipments", request.url), 303);
}
