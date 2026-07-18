import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminSession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

const emptyToUndefined = (val: unknown) => (val === "" ? undefined : val);

const UpdateInfluencerSchema = z.object({
  name: z.string().trim().min(1),
  email: z.email().trim(),
  phone: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  cpf: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  shirtSize: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  addressStreet: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  addressNumber: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  addressNeighborhood: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  addressCity: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  addressState: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  addressZip: z.preprocess(emptyToUndefined, z.string().trim().optional()),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await verifyAdminSession();
  const { id } = await params;

  const formData = await request.formData();
  const parsed = UpdateInfluencerSchema.safeParse(Object.fromEntries(formData));

  const editUrl = (suffix: string) => new URL(`/admin/influencers/${id}/edit${suffix}`, request.url);

  if (!parsed.success) {
    return NextResponse.redirect(editUrl("?error=invalid"), 303);
  }

  const { name, email, ...details } = parsed.data;

  const existingEmail = await prisma.influencer.findUnique({ where: { email } });
  if (existingEmail && existingEmail.id !== id) {
    return NextResponse.redirect(editUrl("?error=email_taken"), 303);
  }

  await prisma.influencer.update({
    where: { id },
    data: { name, email, ...details },
  });

  return NextResponse.redirect(new URL("/admin", request.url), 303);
}
