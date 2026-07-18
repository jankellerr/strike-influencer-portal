import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminSession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

const CreateVideoSchema = z.object({
  title: z.string().trim().min(1),
  url: z.url(),
  description: z.string().trim().optional(),
});

export async function POST(request: NextRequest) {
  await verifyAdminSession();

  const formData = await request.formData();
  const parsed = CreateVideoSchema.safeParse({
    title: formData.get("title"),
    url: formData.get("url"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return NextResponse.redirect(new URL("/admin/videos?error=invalid", request.url), 303);
  }

  const last = await prisma.tutorialVideo.findFirst({ orderBy: { order: "desc" } });

  await prisma.tutorialVideo.create({
    data: {
      title: parsed.data.title,
      url: parsed.data.url,
      description: parsed.data.description,
      order: (last?.order ?? -1) + 1,
    },
  });

  return NextResponse.redirect(new URL("/admin/videos", request.url), 303);
}
