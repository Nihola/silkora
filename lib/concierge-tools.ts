import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { tool } from "ai";
import { z } from "zod";
import { nearbyPlaces } from "@/data/nearby-places";
import { travelPackages } from "@/data/packages";
import { cityOptions } from "@/data/home-seed";
import { cityWeatherSeed, fairPriceSeed, scamAlertSeed } from "@/data/concierge-seed";
import { haversineKm } from "@/lib/geo";
import { isOpenNow } from "@/lib/opening-hours";

const citySchema = z.string().trim().min(2).max(40).optional();
const placeTypes = ["restaurant", "cafe", "atm", "pharmacy", "hotel", "attraction"] as const;
const packageStyles = ["culture", "adventure", "food", "family", "budget", "luxury"] as const;
const usedSosConfirmations = new Set<string>();
function sosSecret() { return process.env.CRON_SECRET || "silkora-demo-sos-confirmation-v1"; }
function signSosPayload(payload: string) { return createHmac("sha256", sosSecret()).update(payload).digest("base64url"); }

async function readSupabase<T>(table: string, select: string): Promise<T[] | null> {
  const baseUrl = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!baseUrl || !key) return null;
  try {
    const url = new URL(`/rest/v1/${table}`, baseUrl);
    url.searchParams.set("select", select);
    const response = await fetch(url, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data: unknown = await response.json();
    return Array.isArray(data) ? data as T[] : null;
  } catch { return null; }
}

type DbPlace = { id: string; type: string; name: string; city: string; lat: number; lng: number; price_level?: number; rating?: number; review_count?: number; cuisine?: string; tags?: string[]; accessibility?: Record<string, boolean>; opening_hours?: { daily?: string } | string; photo?: string; description?: string; verified?: boolean };
function mapPlace(row: DbPlace) {
  return { id: row.id, type: row.type, name: row.name, city: row.city, lat: Number(row.lat), lng: Number(row.lng), priceLevel: row.price_level, rating: row.rating, reviewCount: row.review_count ?? 0, cuisine: row.cuisine, tags: row.tags ?? [], halal: row.accessibility?.halal ?? false, vegetarian: row.accessibility?.vegetarian ?? false, family: row.accessibility?.family ?? false, openingHours: typeof row.opening_hours === "string" ? { daily: row.opening_hours } : { daily: row.opening_hours?.daily ?? "Hours vary" }, photo: row.photo ?? "/images/places/attraction.svg", description: row.description ?? "", verified: row.verified ?? false };
}

export function buildConciergeTools(userId: string) {
  return {
    search_places: tool({
      description: "Find seeded or database-backed Uzbekistan places. Use this before recommending a specific venue.",
      inputSchema: z.object({ city: citySchema, type: z.enum(placeTypes).optional(), filters: z.object({ cuisine: z.string().max(40).optional(), priceLevel: z.number().int().min(1).max(5).optional(), halal: z.boolean().optional(), vegetarian: z.boolean().optional(), family: z.boolean().optional(), openNow: z.boolean().optional() }).optional(), near: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180), radiusKm: z.number().min(0.1).max(100).default(10) }).optional() }),
      execute: async ({ city, type, filters, near }) => {
        const rows = await readSupabase<DbPlace>("places", "id,type,name,city,lat,lng,price_level,rating,review_count,cuisine,tags,accessibility,opening_hours,photo,description,verified");
        let found = (rows?.length ? rows.map(mapPlace) : nearbyPlaces).filter((place) => !city || place.city.toLowerCase() === city.toLowerCase()).filter((place) => !type || place.type === type);
        if (filters?.cuisine) found = found.filter((place) => place.cuisine?.toLowerCase().includes(filters.cuisine!.toLowerCase()));
        if (filters?.priceLevel) found = found.filter((place) => place.priceLevel === filters.priceLevel);
        if (filters?.halal) found = found.filter((place) => place.halal);
        if (filters?.vegetarian) found = found.filter((place) => place.vegetarian);
        if (filters?.family) found = found.filter((place) => place.family);
        if (filters?.openNow) found = found.filter((place) => isOpenNow(place.openingHours));
        if (near) found = found.map((place) => ({ ...place, distanceKm: haversineKm(near, place) })).filter((place) => place.distanceKm <= near.radiusKm).sort((a, b) => a.distanceKm - b.distanceKm);
        return { source: rows?.length ? "database" : "seeded demo data", items: found.slice(0, 8) };
      },
    }),
    search_packages: tool({
      description: "Search Uzbekistan tour packages by city, duration, price budget, or style.",
      inputSchema: z.object({ city: citySchema, days: z.number().int().min(1).max(30).optional(), budget: z.number().min(0).max(100_000).optional(), style: z.enum(packageStyles).optional() }),
      execute: async ({ city, days, budget, style }) => {
        type DbPackage = { id: string; title: string; city: string[]; days: number; price_usd: number; style: string; rating: number; photo?: string; includes?: string[] };
        const rows = await readSupabase<DbPackage>("packages", "id,title,city,days,price_usd,style,rating,photo,includes");
        const items = rows?.length ? rows.map((row) => ({ id: row.id, title: row.title, cities: row.city, days: row.days, priceUsd: row.price_usd, style: row.style, rating: row.rating, photo: row.photo, includes: row.includes ?? [] })) : travelPackages;
        const filtered = items.filter((item) => !city || item.cities.some((name) => name.toLowerCase() === city.toLowerCase()) || item.cities.includes("multiple"))
          .filter((item) => !days || item.days <= days).filter((item) => budget === undefined || item.priceUsd <= budget).filter((item) => !style || item.style === style)
          .sort((a, b) => b.rating - a.rating).slice(0, 6);
        return { source: rows?.length ? "database" : "seeded demo data", items: filtered };
      },
    }),
    get_fair_price: tool({
      description: "Look up a sample fair price guide range in Uzbek som. Always state that estimates can vary and should be checked locally.",
      inputSchema: z.object({ item: z.string().trim().min(2).max(100), city: citySchema }),
      execute: async ({ item, city }) => {
        type DbPrice = { item: string; city: string; fair_min: number; fair_max: number; currency: string; unit: string };
        const rows = await readSupabase<DbPrice>("price_guide", "item,city,fair_min,fair_max,currency,unit");
        const source = rows?.length ? rows.map((row) => ({ item: row.item, city: row.city, fairMin: row.fair_min, fairMax: row.fair_max, currency: row.currency, unit: row.unit })) : fairPriceSeed;
        const terms = item.toLowerCase().split(/\s+/).filter((word) => word.length > 2);
        const matching = source.filter((row) => (!city || row.city.toLowerCase() === city.toLowerCase()) && (row.item.toLowerCase().includes(item.toLowerCase()) || terms.some((term) => row.item.toLowerCase().includes(term))));
        return { source: rows?.length ? "database" : "seeded demo data", items: (matching.length ? matching : source.filter((row) => !city || row.city.toLowerCase() === city.toLowerCase())).slice(0, 5), note: "Indicative estimates only; confirm the price locally." };
      },
    }),
    get_scam_alerts: tool({
      description: "Return general scam-awareness reminders for a city. Seeded reminders are not verified reports about named people or businesses.",
      inputSchema: z.object({ city: citySchema }),
      execute: async ({ city }) => {
        type DbAlert = { city: string; title: string; description: string; category: string; verified: boolean; is_demo: boolean };
        const rows = await readSupabase<DbAlert>("scam_alerts", "city,title,description,category,verified,is_demo");
        const alerts = rows?.length ? rows.map((row) => ({ city: row.city, title: row.title, description: row.description, category: row.category, verified: row.verified, demo: row.is_demo })) : scamAlertSeed;
        return { source: rows?.length ? "database" : "seeded demo data", items: alerts.filter((alert) => !city || alert.city.toLowerCase() === city.toLowerCase()).slice(0, 6), note: "Awareness guidance, not a verified allegation against a person or business." };
      },
    }),
    add_to_trip: tool({
      description: "Add a recommended package or place to the traveler's My Trip plan. This action is reversible.",
      inputSchema: z.object({ title: z.string().trim().min(1).max(120), kind: z.enum(["package", ...placeTypes, "idea"]), city: z.string().trim().min(2).max(40).default("Tashkent"), packageId: z.string().optional(), placeId: z.string().optional(), photo: z.string().max(500).optional(), lat: z.number().optional(), lng: z.number().optional(), day: z.number().int().min(1).max(14).default(1) }),
      execute: async (item) => ({ action: "add_to_trip", demo: true, item: { ...item, id: item.packageId ?? (item.placeId ? `place:${item.placeId}` : `concierge-${randomUUID()}`) } }),
    }),
    create_booking_request: tool({
      description: "Create a pending, no-payment booking request after the user supplies dates, guest count, and message. This is a demo request and does not contact a provider.",
      inputSchema: z.object({ targetType: z.enum(["package", "place", "host"]), targetId: z.string().min(1).max(100), targetTitle: z.string().min(1).max(160), startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), guests: z.number().int().min(1).max(30), message: z.string().max(1000).default("") }).refine(({ startDate, endDate }) => endDate >= startDate, "End date must be on or after the start date."),
      execute: async (request) => ({ action: "create_booking_request", demo: true, bookingRequest: { id: randomUUID(), targetType: request.targetType, targetId: request.targetId, targetTitle: request.targetTitle, dates: { start: request.startDate, end: request.endDate }, guests: request.guests, message: request.message, status: "pending", demo: true, createdAt: new Date().toISOString() } }),
    }),
    find_hosts: tool({
      description: "Host matching is planned for a later build prompt. Be transparent that matching is not available yet.",
      inputSchema: z.object({ city: citySchema, interest: z.string().max(80).optional(), language: z.string().max(40).optional() }),
      execute: async () => ({ available: false, stub: true, message: "Host matching is not available in this build yet." }),
    }),
    get_weather: tool({
      description: "Get current weather for one of the seeded Uzbekistan cities. Use Open-Meteo and fall back to labeled sample weather.",
      inputSchema: z.object({ city: z.enum(["Tashkent", "Samarkand", "Bukhara", "Khiva"]) }),
      execute: async ({ city }) => {
        const point = cityOptions.find(({ name }) => name === city) ?? cityOptions[0];
        try {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${point.lat}&longitude=${point.lng}&current=temperature_2m,weather_code&timezone=auto`;
          const response = await fetch(url, { signal: AbortSignal.timeout(3500), cache: "no-store" });
          if (response.ok) {
            const data = await response.json() as { current?: { temperature_2m?: number; weather_code?: number } };
            if (typeof data.current?.temperature_2m === "number") return { city, temperatureC: data.current.temperature_2m, weatherCode: data.current.weather_code, source: "Open-Meteo" };
          }
        } catch { /* Use seeded demo forecast below. */ }
        return { city, ...cityWeatherSeed[city], source: "seeded demo forecast", demo: true };
      },
    }),
    trigger_sos: tool({
      description: "Prepare an SOS action only. Never trigger it yourself. Return a confirmation request; the UI must ask the user to explicitly confirm before the separate confirmation endpoint records a demo event.",
      inputSchema: z.object({ reason: z.string().max(240).default("Traveler requested help") }),
      execute: async ({ reason }) => {
        const payload = Buffer.from(JSON.stringify({ userId, reason, nonce: randomUUID(), expiresAt: Date.now() + 5 * 60_000 })).toString("base64url");
        const token = `${payload}.${signSosPayload(payload)}`;
        return { action: "sos_confirmation_required", confirmationToken: token, reason, demo: true };
      },
    }),
  };
}

export function confirmSos(token: string, userId: string) {
  const [payload, signature] = token.split(".");
  if (!payload || !signature || usedSosConfirmations.has(token)) return null;
  const expected = Buffer.from(signSosPayload(payload));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  try {
    const approval = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { userId?: string; reason?: string; nonce?: string; expiresAt?: number };
    if (approval.userId !== userId || !approval.nonce || !approval.expiresAt || approval.expiresAt < Date.now()) return null;
    usedSosConfirmations.add(token);
    return { id: approval.nonce, reason: approval.reason ?? "", userId, status: "demo-confirmed", createdAt: new Date().toISOString(), contactedEmergencyServices: false };
  } catch { return null; }
}
