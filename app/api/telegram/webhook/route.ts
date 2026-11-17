import { NextResponse } from "next/server";
import { linkDemoContact, rest } from "@/lib/safety-server";

export const runtime = "nodejs";
type TelegramUpdate = { message?: { text?: string; chat?: { id?: number; first_name?: string } } };

export async function POST(request: Request) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected || request.headers.get("x-telegram-bot-api-secret-token") !== expected) return NextResponse.json({ ok: false }, { status: 401 });
  const update = await request.json().catch(() => null) as TelegramUpdate | null;
  const [command, token] = update?.message?.text?.trim().split(/\s+/, 2) ?? [];
  const chatId = update?.message?.chat?.id;
  if (command !== "/start" || !token || !chatId) return NextResponse.json({ ok: true });
  const rows = await rest(`emergency_contacts?link_token=eq.${encodeURIComponent(token)}&select=id`, { method: "PATCH", body: JSON.stringify({ telegram_chat_id: String(chatId), linked_at: new Date().toISOString(), link_token: null }) });
  const linked = Array.isArray(rows) && rows.length > 0 ? true : linkDemoContact(token, String(chatId));
  return NextResponse.json({ ok: true, linked });
}
