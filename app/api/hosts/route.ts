import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { allow, clientIp } from "@/lib/rate-limit";
import { getHosts } from "@/lib/host-directory";

export const runtime = "nodejs";
const bookingSchema = z.object({ userId: z.string().uuid(), hostId: z.string().uuid(), requestType: z.enum(["stay", "experience"]), startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), guests: z.number().int().min(1).max(20), message: z.string().trim().max(1200).default("") }).refine((item) => item.endDate >= item.startDate, "End date must be on or after start date.");

export async function GET() {
  return NextResponse.json({ hosts: await getHosts(), source: process.env.SUPABASE_SERVICE_ROLE_KEY ? "database-or-seed" : "seeded" });
}

export async function POST(request: Request) {
  if (!allow(`hosts:${clientIp(request)}`, 10)) return NextResponse.json({ error: "Too many requests. Please wait a minute and try again." }, { status: 429, headers: { "Retry-After": "60" } });
  const parsed = bookingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check the booking details." }, { status: 400 });
  const input = parsed.data;
  const host = (await getHosts()).find((candidate) => candidate.id === input.hostId);
  if (!host) return NextResponse.json({ error: "That host could not be found." }, { status: 404 });
  const baseUrl = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (baseUrl && key) {
    const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation,resolution=merge-duplicates" };
    try {
      await fetch(`${baseUrl}/rest/v1/profiles?on_conflict=id`, { method: "POST", headers, body: JSON.stringify({ id: input.userId, role: "traveler", display_name: "Traveler" }) });
      const saved = await fetch(`${baseUrl}/rest/v1/booking_requests`, { method: "POST", headers, body: JSON.stringify({ user_id: input.userId, target_type: "host", target_id: host.id, dates: { start: input.startDate, end: input.endDate, request_type: input.requestType }, guests: input.guests, message: input.message, status: "pending" }) });
      if (saved.ok) return NextResponse.json({ request: (await saved.json())[0], demo: false });
    } catch { /* Return a pending local demo request when the data service is unavailable. */ }
  }
  return NextResponse.json({ request: { id: randomUUID(), target_type: "host", target_id: host.id, dates: { start: input.startDate, end: input.endDate, request_type: input.requestType }, guests: input.guests, message: input.message, status: "pending", demo: true }, demo: true });
}
