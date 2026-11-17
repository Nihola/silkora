import { NextResponse } from "next/server";
import { DEMO_STORAGE_PREFIX, DEMO_USER_ID } from "@/lib/demo";
import { resetDemoState } from "@/lib/safety-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Dev-only: clears this browser's Silkora state, resets server demo state, and signs in as the demo user. */
export function GET(request: Request) {
  if (process.env.NODE_ENV === "production") return new NextResponse("Not found", { status: 404 });
  resetDemoState();
  const target = new URL("/en", request.url).toString();
  const html = `<!doctype html><meta charset="utf-8"><title>Resetting demo…</title><p>Resetting demo…</p><script>
try {
  Object.keys(localStorage).filter(function (k) { return k.indexOf(${JSON.stringify(DEMO_STORAGE_PREFIX)}) === 0; }).forEach(function (k) { localStorage.removeItem(k); });
  localStorage.setItem("silkora-chat-user-id", ${JSON.stringify(DEMO_USER_ID)});
  localStorage.setItem("silkora-onboarding-complete", "true");
} catch (e) {}
location.replace(${JSON.stringify(target)});
</script>`;
  return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}
