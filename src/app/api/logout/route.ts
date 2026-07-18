import { NextRequest, NextResponse } from "next/server";
import { deleteInfluencerSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  await deleteInfluencerSession();
  return NextResponse.redirect(new URL("/login", request.url), 303);
}
