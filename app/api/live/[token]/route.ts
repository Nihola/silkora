import { NextResponse } from "next/server";
import { readLiveShare } from "@/lib/safety-server";

export const runtime = "nodejs";
export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const share = await readLiveShare(token);
  if (!share || !share.active) return NextResponse.json({ active: false }, { status: 404 });
  return NextResponse.json(share, { headers: { "Cache-Control": "no-store" } });
}
