import { NextResponse } from "next/server";
import { getDemoContacts, rest, sendTelegram } from "@/lib/safety-server";

export const runtime = "nodejs";
type DueCheckin = { id: string; user_id: string; label: string; due_at: string };
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const due = await rest(`checkins?select=id,user_id,label,due_at&due_at=lte.${encodeURIComponent(new Date().toISOString())}&checked_in_at=is.null&alerted_at=is.null&limit=100`);
  if (!Array.isArray(due) || !due.length) return NextResponse.json({ processed: 0, notified: 0 });
  let notified = 0;
  for (const checkin of due as DueCheckin[]) {
    const contacts = await rest(`emergency_contacts?select=telegram_chat_id&user_id=eq.${checkin.user_id}&linked_at=not.is.null&notification_consent=eq.true`);
    const recipients = Array.isArray(contacts) && contacts.length ? contacts as { telegram_chat_id?: string }[] : getDemoContacts(checkin.user_id);
    const results = await Promise.all(recipients.filter((item) => item.telegram_chat_id).map((item) => sendTelegram(item.telegram_chat_id!, `Silkora check-in reminder: ${checkin.label} is overdue. Please check in with your traveler.`)));
    notified += results.filter(Boolean).length;
    await rest(`checkins?id=eq.${checkin.id}`, { method: "PATCH", body: JSON.stringify({ alerted_at: new Date().toISOString() }) });
  }
  return NextResponse.json({ processed: due.length, notified });
}
