import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getPromocodeById } from "@/lib/yampi/client";

const CreateInfluencerSchema = z.object({
  name: z.string().trim().min(1),
  email: z.email().trim(),
  yampiPromoId: z.string().trim().min(1),
});

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const parsed = CreateInfluencerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    yampiPromoId: formData.get("yampiPromoId"),
  });

  if (!parsed.success) {
    return NextResponse.redirect(
      new URL("/admin/influencers/new?error=invalid", request.url),
      303,
    );
  }

  const { name, email, yampiPromoId } = parsed.data;

  const [existingEmail, existingCoupon] = await Promise.all([
    prisma.influencer.findUnique({ where: { email } }),
    prisma.coupon.findUnique({ where: { yampiPromoId } }),
  ]);

  if (existingEmail) {
    return NextResponse.redirect(
      new URL("/admin/influencers/new?error=email_taken", request.url),
      303,
    );
  }
  if (existingCoupon) {
    return NextResponse.redirect(
      new URL("/admin/influencers/new?error=coupon_taken", request.url),
      303,
    );
  }

  const promocode = await getPromocodeById(yampiPromoId);

  await prisma.influencer.create({
    data: {
      name,
      email,
      coupon: {
        create: {
          yampiPromoId: String(promocode.id),
          code: promocode.code,
          discountType: promocode.discount_type,
          discountValue: promocode.value,
          active: promocode.active,
        },
      },
    },
  });

  return NextResponse.redirect(new URL("/admin", request.url), 303);
}
