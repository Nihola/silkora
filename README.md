# Silkora

All-in-one travel companion for Uzbekistan: discover, plan, book requests, toolkit, AI concierge, hosts, and safety (SOS, consent-based live location, check-ins, scam alerts). See [PROJECT.md](PROJECT.md) for product scope.

Built with Next.js 15 (App Router), TypeScript, Tailwind, next-intl (en/ru/uz), Supabase, Leaflet/OSM, Vercel AI SDK, Telegram Bot API.

## Quick start

```bash
npm install
cp .env.example .env.local   # every variable is optional; see below
npm run dev                  # http://localhost:3000
```

The app runs fully on **seeded data** with no env vars. Payments are simulated and labeled **Demo**.

## Environment variables

| Variable | Needed for | Notes |
| --- | --- | --- |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Persisting bookings, shares, contacts | **Server only.** Never prefix with `NEXT_PUBLIC_`. |
| `SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Realtime live-location viewer | Anon key is public by design; RLS protects data. |
| `LLM_API_KEY`, `LLM_MODEL`, `LLM_BASE_URL` | AI Concierge | Without a key the concierge answers from seeded tools. |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET` | Emergency-contact alerts | Webhook: `POST /api/telegram/webhook` with `secret_token` = `TELEGRAM_WEBHOOK_SECRET`. |
| `CRON_SECRET` | `/api/cron/checkins` | Required; the route returns 401 without `Authorization: Bearer <CRON_SECRET>`. Vercel sends it automatically. |
| `NEXT_PUBLIC_SITE_URL` | OG/Twitter tags | Optional; falls back to Vercel's production URL. |

## Database

Apply `supabase/migrations/*.sql` in order, then `supabase/seed.sql`. RLS is enabled on every table; the server uses the service-role key only inside `app/api/*`.

## Demo

- `GET /demo` (**development only**, 404 in production) clears this browser's `silkora-*` local state, resets in-memory server demo state, and signs in as the fixed demo user (`lib/demo.ts`).
- Trigger the cron manually: `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/checkins`.

## Deploy (Vercel)

1. Import the repo and set the env vars above.
2. `vercel.json` registers the check-in cron daily (`0 6 * * *`, the Hobby-plan maximum). On Pro, change it to `*/5 * * * *` for timely reminders.

## Known demo limits

- Without Supabase, live-share and contact state lives in server memory and rate limits are per instance; on serverless a share link may not resolve on another instance. Configure Supabase for a reliable demo.
- Community and Souvenir market are labeled Demo placeholders.

## Scripts

`npm run dev` · `npm run build` · `npm run lint` · `npx tsc --noEmit`
