import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { nearestSafetyPlaces } from "@/data/safety-seed";
import { addDemoContact, createLiveShare, ensureSafetyProfile, getDemoContacts, rest, sendTelegram, stopLiveShare, updateLiveShare } from "@/lib/safety-server";

export const runtime = "nodejs";
const userIdSchema = z.string().uuid();
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start-share"), userId: userIdSchema, name: z.string().trim().min(1).max(100).default("Traveler"), city: z.string().min(2).max(40).default("Tashkent"), lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }),
  z.object({ action: z.literal("update-share"), userId: userIdSchema, token: z.string().uuid(), lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }),
  z.object({ action: z.literal("stop-share"), userId: userIdSchema, token: z.string().uuid() }),
  z.object({ action: z.literal("create-contact"), userId: userIdSchema, name: z.string().trim().min(1).max(80), phone: z.string().trim().min(4).max(40), relationship: z.string().max(50).default(""), notificationConsent: z.literal(true) }),
  z.object({ action: z.literal("checkin"), userId: userIdSchema, label: z.string().trim().min(1).max(100), minutes: z.number().int().min(5).max(1440) }),
  z.object({ action: z.literal("safe-checkin"), userId: userIdSchema, checkinId: z.string().uuid() }),
  z.object({ action: z.literal("report-scam"), userId: userIdSchema, city: z.string().min(2).max(40), title: z.string().trim().min(4).max(120), description: z.string().trim().min(10).max(2000), category: z.string().max(60).default("general") }),
]);

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check the safety form and try again." }, { status: 400 });
  const body = parsed.data;
  try {
    if (body.action === "start-share") {
      const share = await createLiveShare(body);
      const nearest = nearestSafetyPlaces(body.city, { lat: body.lat, lng: body.lng }).find((place) => place.type === "hospital");
      const link = new URL(`/live/${share.token}`, request.url).toString();
      const contacts = await rest(`emergency_contacts?select=name,telegram_chat_id,notification_consent&user_id=eq.${body.userId}&linked_at=not.is.null`);
      const linked = Array.isArray(contacts) && contacts.length ? contacts as { name?: string; telegram_chat_id?: string; notification_consent?: boolean }[] : getDemoContacts(body.userId);
      const map = `https://www.openstreetmap.org/?mlat=${body.lat}&mlon=${body.lng}#map=16/${body.lat}/${body.lng}`;
      const message = `Silkora SOS: ${body.name} shared their live location.\nMap: ${map}\nLive link: ${link}\nNearest hospital: ${nearest?.name ?? "Check local emergency services"}`;
      const notified = await Promise.all(linked.filter((contact) => contact.telegram_chat_id && contact.notification_consent).map((contact) => sendTelegram(contact.telegram_chat_id!, message)));
      return NextResponse.json({ share, link, notified: notified.filter(Boolean).length, telegramConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN) });
    }
    if (body.action === "update-share") {
      const success = await updateLiveShare(body.token, body.lat, body.lng, body.userId);
      return NextResponse.json({ success }, { status: success ? 200 : 404 });
    }
    if (body.action === "stop-share") {
      const success = await stopLiveShare(body.token, body.userId);
      return NextResponse.json({ success }, { status: success ? 200 : 404 });
    }
    await ensureSafetyProfile(body.userId);
    if (body.action === "create-contact") {
      const linkToken = randomUUID().replaceAll("-", "");
      const rows = await rest("emergency_contacts", { method: "POST", body: JSON.stringify({ user_id: body.userId, name: body.name, phone: body.phone, relationship: body.relationship, phone_verification: "TODO_VERIFY", notification_consent: true, link_token: linkToken, is_demo: true }) });
      if (!Array.isArray(rows) || !rows.length) addDemoContact({ userId: body.userId, name: body.name, phone: body.phone, relationship: body.relationship, linkToken });
      const botName = process.env.TELEGRAM_BOT_USERNAME;
      return NextResponse.json({ contact: Array.isArray(rows) ? rows[0] : null, telegramUrl: botName ? `https://t.me/${botName}?start=${linkToken}` : null, demo: !Array.isArray(rows) || !rows.length });
    }
    if (body.action === "checkin") {
      const dueAt = new Date(Date.now() + body.minutes * 60_000).toISOString();
      const rows = await rest("checkins", { method: "POST", body: JSON.stringify({ user_id: body.userId, label: body.label, due_at: dueAt }) });
      return NextResponse.json({ checkin: Array.isArray(rows) ? rows[0] : { id: randomUUID(), label: body.label, due_at: dueAt, demo: true } });
    }
    if (body.action === "safe-checkin") {
      await rest(`checkins?id=eq.${body.checkinId}&user_id=eq.${body.userId}`, { method: "PATCH", body: JSON.stringify({ checked_in_at: new Date().toISOString() }) });
      return NextResponse.json({ success: true });
    }
    if (body.action === "report-scam") {
      const rows = await rest("scam_alerts", { method: "POST", body: JSON.stringify({ city: body.city, title: body.title, description: body.description, category: body.category, submitted_by: body.userId, verified: false, is_demo: false }) });
      return NextResponse.json({ report: Array.isArray(rows) ? rows[0] : { status: "pending moderation", demo: true } });
    }
  } catch { return NextResponse.json({ error: "Safety service is temporarily unavailable. Use local emergency services if you need urgent help." }, { status: 503 }); }
  return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
}

export async function GET(request: Request) {
  const city = new URL(request.url).searchParams.get("city") ?? "Tashkent";
  const rows = await rest(`scam_alerts?select=city,title,description,category,verified,is_demo,reported_at&city=eq.${encodeURIComponent(city)}&or=(verified.eq.true,is_demo.eq.true)&order=reported_at.desc&limit=8`);
  return NextResponse.json({ alerts: Array.isArray(rows) && rows.length ? rows : null });
}
