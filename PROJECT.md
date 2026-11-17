# Silkora

## Product

**Silkora** is an all-in-one travel companion for visitors to Uzbekistan and local travelers. From landing to flying home, travelers can discover, plan, book, get around, eat, connect, and stay safe. Unlike a chatbot, Silkora takes practical action through clear flows and tools.

## Product pillars

1. **Discover** — find tour packages, attractions, and restaurants by location.
2. **Plan** — build and manage an itinerary in **My Trip**.
3. **Book** — submit request-to-book requests and track their status.
4. **Traveler Toolkit** — transport guidance, phrasebook, currency, weather, and fair-price guide.
5. **AI Concierge** — answer travel questions and take useful actions through tools.
6. **Connect** — match hosts with guests and offer a traveler buddy board.
7. **Safety** — SOS, consent-based live location, check-ins, and scam alerts.
8. **Marketplace-lite** — browse local souvenirs.
9. **Partner B2B dashboard** — let local partners manage their listings and booking requests.

## Stack

- Next.js 15 App Router and TypeScript
- Tailwind CSS and shadcn/ui
- Supabase
- Leaflet with OpenStreetMap
- Vercel AI SDK
- Telegram Bot API
- next-intl: English (`en`), Russian (`ru`), and Uzbek (`uz`)
- Progressive web app (PWA)

The current repository is a minimal Next.js starter. Its installed Next.js version may differ from the target stack; treat this document as the product and implementation target, and check before changing dependency versions.

## Working rules

- Build mobile-first; make primary actions comfortable on small screens.
- Every feature must have seeded-data fallback so the demo remains usable without external services, credentials, or network access.
- Never imply a real payment occurred. Payments are simulated and clearly labeled **Demo**.
- Ask for explicit consent before sharing a traveler's location; make sharing state visible and easy to stop.
- Keep files small, typed, and focused. Avoid unnecessary abstractions and infrastructure.
- Put required environment variable names and safe example values in `.env.example`; never commit secrets.
- Make changes in reviewable, commit-sized increments.
- Favor functional, demonstrable flows over placeholder buttons. Make loading, empty, and error states clear.

## Repository conventions

Use the existing root `app/` App Router layout unless the codebase grows enough to justify `src/`. Keep routes and route-specific UI together, and move reusable code into focused top-level directories:

```text
app/                    # routes, layouts, loading/error states
  api/<feature>/route.ts # server API endpoints
components/             # shared UI; shadcn primitives in components/ui/
features/<feature>/     # feature-specific components, schemas, and logic
lib/                    # shared clients and utilities (e.g. Supabase, AI)
data/                   # seeded demo data and fallback adapters
messages/               # next-intl dictionaries: en.json, ru.json, uz.json
public/                 # static assets, icons, and PWA files
```

Use lowercase kebab-case for route segments and filenames; use PascalCase for React components and types, and camelCase for functions and variables. Give feature code a clear home rather than growing monolithic route files. Validate external input at API boundaries and keep secrets and privileged Supabase operations on the server.

### API routes

Add HTTP handlers under `app/api/<feature>/route.ts` (for example, `app/api/bookings/route.ts`). Keep handlers thin: validate input, call feature logic, and return typed JSON with appropriate status codes. Seeded fallback behavior belongs in a data adapter so API and UI flows can use it consistently.

### Translations

Keep user-facing strings in next-intl message dictionaries under `messages/`, with matching keys in `en.json`, `ru.json`, and `uz.json`. To add a key, add the same nested key to all three files, then use the typed next-intl translation function in the component; do not hard-code UI copy or silently omit a locale. Keep interpolation placeholders consistent across locales.

## Hackathon schedule

- **Feature freeze:** 23 November 2026
- **Submission:** 26 November 2026

Prioritize a coherent end-to-end demo across the pillars, with seeded fallbacks and clear demo labeling.
