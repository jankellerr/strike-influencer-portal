import { NextRequest, NextResponse } from "next/server";
import { deleteAdminSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  await deleteAdminSession();
  return NextResponse.redirect(new URL("/admin/login", request.url), 303);
}
