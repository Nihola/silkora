import { randomUUID } from "node:crypto";

type SharePoint = { token: string; userId: string; lat: number; lng: number; expiresAt: string; stoppedAt: string | null; displayName: string };
const demoShares = new Map<string, SharePoint>();
type DemoContact = { userId: string; name: string; phone: string; relationship: string; linkToken: string; chatId?: string };
const demoContacts = new Map<string, DemoContact>();

export function resetDemoState() { demoShares.clear(); demoContacts.clear(); }
export function addDemoContact(contact: DemoContact) { demoContacts.set(contact.linkToken, contact); }
export function linkDemoContact(linkToken: string, chatId: string) {
  const contact = demoContacts.get(linkToken);
  if (!contact) return false;
  contact.chatId = chatId; contact.linkToken = ""; demoContacts.delete(linkToken); demoContacts.set(`chat:${chatId}`, contact);
  return true;
}
export function getDemoContacts(userId: string) { return [...demoContacts.values()].filter((contact) => contact.userId === userId && contact.chatId).map((contact) => ({ name: contact.name, telegram_chat_id: contact.chatId, notification_consent: true })); }

function supabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url: url.replace(/\/$/, ""), key } : null;
}
async function rest(path: string, init: RequestInit = {}) {
  const config = supabaseConfig();
  if (!config) return null;
  try {
    const prefer = init.method === "POST" ? "return=representation,resolution=merge-duplicates" : "return=representation";
    const response = await fetch(`${config.url}/rest/v1/${path}`, { ...init, headers: { apikey: config.key, Authorization: `Bearer ${config.key}`, "Content-Type": "application/json", Prefer: prefer, ...init.headers }, cache: "no-store", signal: AbortSignal.timeout(4000) });
    if (!response.ok) return null;
    return response.status === 204 ? [] : await response.json().catch(() => []);
  } catch { return null; }
}

export async function ensureSafetyProfile(userId: string) {
  await rest("profiles?on_conflict=id", { method: "POST", body: JSON.stringify({ id: userId, role: "traveler", display_name: "Traveler" }) });
}

export async function createLiveShare(input: { userId: string; name: string; lat: number; lng: number }) {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  await ensureSafetyProfile(input.userId);
  const persisted = await rest("live_shares", { method: "POST", body: JSON.stringify({ user_id: input.userId, consented_at: new Date().toISOString(), expires_at: expiresAt, lat: input.lat, lng: input.lng }) });
  const created = Array.isArray(persisted) ? persisted[0] as { id?: string } | undefined : undefined;
  const shareToken = created?.id ?? token;
  demoShares.set(token, { token, userId: input.userId, lat: input.lat, lng: input.lng, expiresAt, stoppedAt: null, displayName: input.name });
  demoShares.set(shareToken, { token: shareToken, userId: input.userId, lat: input.lat, lng: input.lng, expiresAt, stoppedAt: null, displayName: input.name });
  return { token: shareToken, expiresAt, source: created?.id ? "database" : "demo" };
}

export async function updateLiveShare(token: string, lat: number, lng: number, ownerId?: string) {
  const demo = demoShares.get(token);
  if (demo && (demo.userId !== ownerId || new Date(demo.expiresAt).getTime() <= Date.now() || demo.stoppedAt)) return false;
  if (demo) {
    demo.lat = lat; demo.lng = lng;
  }
  const rows = await rest(`live_shares?id=eq.${encodeURIComponent(token)}&user_id=eq.${encodeURIComponent(ownerId ?? "")}&stopped_at=is.null&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=id`, { method: "PATCH", body: JSON.stringify({ lat, lng, updated_at: new Date().toISOString() }) });
  if (!demo && (!Array.isArray(rows) || !rows.length)) return false;
  return Boolean(demo || (Array.isArray(rows) && rows.length));
}

export async function readLiveShare(token: string) {
  const rows = await rest(`live_shares?select=id,lat,lng,expires_at,stopped_at,updated_at&id=eq.${encodeURIComponent(token)}&limit=1`);
  const row = Array.isArray(rows) ? rows[0] as Record<string, unknown> | undefined : undefined;
  if (row && typeof row.lat === "number" && typeof row.lng === "number") return { token, lat: row.lat, lng: row.lng, expiresAt: String(row.expires_at), stoppedAt: typeof row.stopped_at === "string" ? row.stopped_at : null, updatedAt: String(row.updated_at), active: !row.stopped_at && new Date(String(row.expires_at)).getTime() > Date.now() };
  const demo = demoShares.get(token);
  if (!demo) return null;
  return { ...demo, updatedAt: new Date().toISOString(), active: !demo.stoppedAt && new Date(demo.expiresAt).getTime() > Date.now() };
}

export async function stopLiveShare(token: string, userId: string) {
  const demo = demoShares.get(token);
  if (demo && demo.userId !== userId) return false;
  if (demo) demo.stoppedAt = new Date().toISOString();
  const stoppedAt = new Date().toISOString();
  const rows = await rest(`live_shares?id=eq.${encodeURIComponent(token)}&user_id=eq.${encodeURIComponent(userId)}&select=id`, { method: "PATCH", body: JSON.stringify({ stopped_at: stoppedAt, updated_at: stoppedAt }) });
  if (!demo && (!Array.isArray(rows) || !rows.length)) return false;
  return true;
}

export async function sendTelegram(chatId: string, text: string) {
  const bot = process.env.TELEGRAM_BOT_TOKEN;
  if (!bot) return false;
  try {
    const response = await fetch(`https://api.telegram.org/bot${bot}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: false }), signal: AbortSignal.timeout(5000) });
    return response.ok;
  } catch { return false; }
}

export { rest };
