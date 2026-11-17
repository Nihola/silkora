"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowDown, ArrowRight, ArrowUp, CalendarDays, Check, GripVertical, MapPin, Plus, Share2, Trash2, Users } from "lucide-react";
import { travelPackages } from "@/data/packages";
import { nearbyPlaces, type NearbyPlace } from "@/data/nearby-places";
import { cityOptions } from "@/data/home-seed";
import { LeafletMapView } from "@/components/explore/leaflet-map";

type TripItem = { id: string; title: string; kind: string; city: string; photo?: string; priceUsd?: number; day: number; packageId?: string; placeId?: string; lat?: number; lng?: number };
type BookingRequest = { id: string; targetTitle: string; targetId?: string; dates?: { start?: string; end?: string }; guests?: number; message?: string; status: "pending" | "accepted" | "declined"; demo?: boolean };
type Notification = { id: string; title: string; body: string; demo: true; createdAt: string };
const ITEMS_KEY = "silkora-trip-items";

function normalizeItems(raw: unknown): TripItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object" && typeof (item as Record<string, unknown>).id === "string"))
    .map((entry) => {
      const id = String(entry.id);
      const packageItem = travelPackages.find((item) => item.id === id);
      const placeId = id.startsWith("place:") ? id.slice(6) : undefined;
      const place = placeId ? nearbyPlaces.find((item) => item.id === placeId) : undefined;
      const day = typeof entry.day === "number" && entry.day > 0 ? Math.floor(entry.day) : 1;
      if (packageItem) return { id, title: packageItem.title, kind: "package", city: packageItem.cities[0] ?? "Tashkent", photo: packageItem.photo, priceUsd: packageItem.priceUsd, packageId: id, day };
      if (place) return { id, title: place.name, kind: place.type, city: place.city, photo: place.photo, placeId, day, lat: place.lat, lng: place.lng };
      return { id, title: String(entry.title ?? "Trip idea"), kind: String(entry.kind ?? "idea"), city: String(entry.city ?? "Tashkent"), photo: typeof entry.photo === "string" ? entry.photo : undefined, priceUsd: typeof entry.priceUsd === "number" ? entry.priceUsd : undefined, lat: typeof entry.lat === "number" ? entry.lat : undefined, lng: typeof entry.lng === "number" ? entry.lng : undefined, day };
    });
}

function estimatedItemBudget(item: TripItem) {
  if (item.priceUsd !== undefined) return item.priceUsd;
  const place = item.placeId ? nearbyPlaces.find(({ id }) => id === item.placeId) : undefined;
  if (place?.fairMin !== undefined && place.fairMax !== undefined) return Math.round(((place.fairMin + place.fairMax) / 2) / 12_500);
  if (item.kind === "hotel") return place?.priceLevel === 1 ? 35 : place?.priceLevel === 2 ? 70 : 130;
  if (item.kind === "attraction") return place?.priceLevel === 2 ? 8 : 4;
  return 0;
}

function mapPoint(name: string, lat: number, lng: number, index: number): NearbyPlace {
  return { id: `trip-map-${index}-${name}`, type: "attraction", name, city: "Tashkent", lat, lng, reviewCount: 0, tags: [], halal: false, vegetarian: false, family: true, openingHours: { daily: "Hours vary" }, photo: "/images/places/attraction.svg", photos: ["/images/places/attraction.svg"], description: name, reviews: [] };
}

export function MyTrip() {
  const t = useTranslations("TripPlanner");
  const baseT = useTranslations("Trip");
  const locale = useLocale();
  const [items, setItems] = useState<TripItem[]>([]);
  const [dayCount, setDayCount] = useState(3);
  const [hasBlankTrip, setHasBlankTrip] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notice, setNotice] = useState("");

  const persistItems = useCallback((next: TripItem[]) => {
    setItems(next);
    try { localStorage.setItem(ITEMS_KEY, JSON.stringify(next)); } catch { /* Keep the edited itinerary available in the current view. */ }
  }, []);

  useEffect(() => {
    try {
      const loaded = normalizeItems(JSON.parse(localStorage.getItem(ITEMS_KEY) ?? "[]"));
      setItems(loaded);
      const storedDays = Number(localStorage.getItem("silkora-trip-days"));
      const requestedDays = Math.max(3, loaded.reduce((max, item) => Math.max(max, item.day), 1), Number.isFinite(storedDays) ? storedDays : 3);
      setDayCount(Math.min(14, requestedDays));
      setHasBlankTrip(localStorage.getItem("silkora-blank-trip-created") === "true");
      setRequests(JSON.parse(localStorage.getItem("silkora-booking-requests") ?? "[]") as BookingRequest[]);
      setNotifications(JSON.parse(localStorage.getItem("silkora-notifications") ?? "[]") as Notification[]);
    } catch { setItems([]); }
  }, []);

  const budget = useMemo(() => items.reduce((sum, item) => sum + estimatedItemBudget(item), 0), [items]);
  const currencyLabel = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(budget);

  function removeItem(id: string) { persistItems(items.filter((item) => item.id !== id)); }
  function moveItem(id: string, day: number, beforeId?: string) {
    const source = items.find((item) => item.id === id);
    if (!source) return;
    const remaining = items.filter((item) => item.id !== id);
    const moved = { ...source, day };
    const targetIndex = beforeId ? remaining.findIndex((item) => item.id === beforeId) : -1;
    if (targetIndex >= 0) remaining.splice(targetIndex, 0, moved); else remaining.push(moved);
    persistItems(remaining);
  }
  function moveWithinDay(id: string, direction: -1 | 1) {
    const item = items.find(({ id: itemId }) => itemId === id);
    if (!item) return;
    const sameDay = items.filter((entry) => entry.day === item.day);
    const current = sameDay.findIndex((entry) => entry.id === id);
    const swap = sameDay[current + direction];
    if (swap) moveItem(id, item.day, direction < 0 ? swap.id : sameDay[current + 2]?.id);
  }
  function addDay() {
    const next = Math.min(14, dayCount + 1);
    setDayCount(next);
    try { localStorage.setItem("silkora-trip-days", String(next)); } catch { /* Keep the added day in current session. */ }
  }

  function createShareLink() {
    const payload = { title: baseT("title"), days: dayCount, items: items.map(({ id, title, kind, city, photo, priceUsd, day, packageId, placeId, lat, lng }) => ({ id, title, kind, city, photo, priceUsd, day, packageId, placeId, lat, lng })) };
    const bytes = new TextEncoder().encode(JSON.stringify(payload));
    let binary = "";
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    const token = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
    const localePrefix = locale === "en" ? "" : `/${locale}`;
    const link = `${window.location.origin}${localePrefix}/trip/${token}`;
    setShareLink(link);
    setShareMessage(t("shareReady"));
    if (navigator.clipboard) void navigator.clipboard.writeText(link).then(() => setShareMessage(t("shareCopied"))).catch(() => undefined);
  }

  function acceptBooking(request: BookingRequest) {
    const nextRequests = requests.map((entry) => entry.id === request.id ? { ...entry, status: "accepted" as const, demo: true } : entry);
    const notification: Notification = { id: `notification-${request.id}`, title: t("bookingAcceptedTitle"), body: t("bookingAcceptedBody", { title: request.targetTitle }), demo: true, createdAt: new Date().toISOString() };
    const nextNotifications = [notification, ...notifications].slice(0, 20);
    setRequests(nextRequests); setNotifications(nextNotifications); setNotice(t("bookingAcceptedToast", { title: request.targetTitle }));
    try { localStorage.setItem("silkora-booking-requests", JSON.stringify(nextRequests)); localStorage.setItem("silkora-notifications", JSON.stringify(nextNotifications)); } catch { /* Show the acceptance notification in this session. */ }
  }

  function itemsForDay(day: number) { return items.filter((item) => item.day === day); }
  function mapForDay(day: number) {
    const dayItems = itemsForDay(day);
    const points: NearbyPlace[] = [];
    dayItems.forEach((item) => {
      if (item.lat !== undefined && item.lng !== undefined) points.push(mapPoint(item.title, item.lat, item.lng, points.length));
      if (item.packageId) {
        const pack = travelPackages.find(({ id }) => id === item.packageId);
        pack?.itinerary[Math.min(day - 1, pack.itinerary.length - 1)]?.stops.forEach((stop) => points.push(mapPoint(stop.name, stop.lat, stop.lng, points.length)));
      }
    });
    const city = cityOptions.find(({ name }) => name.toLowerCase() === (dayItems[0]?.city ?? "tashkent").toLowerCase()) ?? cityOptions[0];
    if (!points.length) points.push(mapPoint(city.name, city.lat, city.lng, 0));
    return { points, center: [points[0].lat, points[0].lng] as [number, number] };
  }

  return <main className="trip-planner-page">
    <header className="trip-planner-header"><p className="card-overline">{baseT("eyebrow")}</p><div className="trip-heading-line"><div><h1>{baseT("title")}</h1><p>{baseT("body")}</p></div><button className="trip-share-button" type="button" onClick={createShareLink}><Share2 size={16} />{t("shareTrip")}</button></div>
      <section className="trip-budget-card"><div><p>{t("estimatedBudget")}</p><small>{t("budgetEstimate")}</small></div><strong>${currencyLabel} <small>USD</small></strong></section>
      {shareLink && <div className="trip-share-result"><label>{t("shareLink")}<input readOnly value={shareLink} onFocus={(event) => event.currentTarget.select()} /></label><span role="status">{shareMessage}</span></div>}
    </header>

    {notice && <div className="trip-notification-toast" role="status"><Check size={16} /><span><strong>{t("demoLabel")}</strong> {notice}</span><button type="button" onClick={() => setNotice("")}>×</button></div>}
    {!!notifications.length && <section className="trip-notifications"><h2>{t("notifications")}</h2>{notifications.slice(0, 3).map((entry) => <article key={entry.id}><span>Demo</span><div><strong>{entry.title}</strong><p>{entry.body}</p></div></article>)}</section>}

    <section className="trip-itinerary-section"><div className="trip-section-heading"><div><p className="card-overline">{t("itineraryEyebrow")}</p><h2>{t("itineraryTitle")}</h2></div><span>{t("dragHint")}</span></div>
      {!items.length && <div className="trip-start-card"><h3>{hasBlankTrip ? baseT("blankTitle") : baseT("emptyTitle")}</h3><p>{hasBlankTrip ? baseT("blankBody") : baseT("emptyBody")}</p><div><Link href="/packages">{t("browsePackages")}</Link><Link href="/explore">{t("explorePlaces")}</Link><Link href="/nearby">{t("nearbyPlaces")}</Link><Link href="/concierge">{t("askConcierge")}</Link></div></div>}
      <div className="trip-days-list">{Array.from({ length: dayCount }, (_, index) => index + 1).map((day) => {
        const dayItems = itemsForDay(day);
        const map = mapForDay(day);
        return <section className="trip-day-card" key={day} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const id = event.dataTransfer.getData("text/plain") || draggedId; if (id) moveItem(id, day); setDraggedId(null); }}>
          <header className="trip-day-heading"><span className="trip-day-number">{day}</span><div><p>{t("dayLabel", { day })}</p><strong>{dayItems.length} {dayItems.length === 1 ? t("itemSingular") : t("itemPlural")}</strong></div><span className="trip-day-budget">${dayItems.reduce((sum, item) => sum + estimatedItemBudget(item), 0)}</span></header>
          <div className="trip-day-items">{dayItems.map((item) => {
            const pack = item.packageId ? travelPackages.find(({ id }) => id === item.packageId) : undefined;
            const place = item.placeId ? nearbyPlaces.find(({ id }) => id === item.placeId) : undefined;
            const href = pack ? `/packages/${pack.id}` : place ? (place.type === "restaurant" || place.type === "cafe" ? `/restaurants/${place.id}` : `/places/${place.id}`) : "/concierge";
            return <article className={`trip-itinerary-item${draggedId === item.id ? " dragging" : ""}`} key={item.id} draggable onDragStart={(event) => { setDraggedId(item.id); event.dataTransfer.setData("text/plain", item.id); event.dataTransfer.effectAllowed = "move"; }} onDragEnd={() => setDraggedId(null)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.stopPropagation(); event.preventDefault(); const sourceId = event.dataTransfer.getData("text/plain") || draggedId; if (sourceId && sourceId !== item.id) moveItem(sourceId, day, item.id); setDraggedId(null); }}>
              <span className="trip-drag-handle" aria-label={t("dragItem", { title: item.title })}><GripVertical size={17} /></span><Link className="trip-item-photo" href={href} style={{ backgroundImage: `url(${item.photo ?? "/images/places/attraction.svg"})` }} aria-label={item.title} /><div className="trip-item-info"><span>{t(`itemKinds.${item.kind}`, { defaultValue: item.kind })}</span><Link href={href}><strong>{item.title}</strong></Link><small><MapPin size={12} />{item.city}</small></div><strong className="trip-item-budget">${estimatedItemBudget(item)}</strong><div className="trip-item-controls"><button type="button" onClick={() => moveWithinDay(item.id, -1)} aria-label={t("moveUp", { title: item.title })}><ArrowUp size={14} /></button><button type="button" onClick={() => moveWithinDay(item.id, 1)} aria-label={t("moveDown", { title: item.title })}><ArrowDown size={14} /></button><button type="button" onClick={() => removeItem(item.id)} aria-label={t("remove", { title: item.title })}><Trash2 size={14} /></button></div>
            </article>;
          })}</div>
          {!dayItems.length && <div className="trip-day-empty"><p>{t("dayEmpty")}</p><div><Link href="/packages">{t("browsePackages")}</Link><Link href="/explore">{t("explorePlaces")}</Link><Link href="/nearby">{t("nearbyPlaces")}</Link></div></div>}
          <details className="trip-day-map"><summary><MapPin size={14} />{t("showDayMap")}</summary><div className="trip-day-map-content"><LeafletMapView places={map.points} center={map.center} selectedId={null} onSelect={() => undefined} mapLabel={t("dayMapLabel", { day })} mapCaption={t("mapDemoCaption")} /></div></details>
        </section>;
      })}</div>
      <button type="button" className="trip-add-day" disabled={dayCount >= 14} onClick={addDay}><Plus size={16} />{t("addDay")}</button>
    </section>

    <section className="trip-transport-links"><p className="card-overline">{t("gettingAround")}</p><h2>{t("transportTitle")}</h2><div><a href="https://eticket.railway.uz/en/" target="_blank" rel="noreferrer"><span>{t("trainLabel")}</span><strong>{t("trainAction")} <ArrowRight size={15} /></strong><small>{t("externalDemoNote")}</small></a><a href="https://go.yandex.uz/en_uz/" target="_blank" rel="noreferrer"><span>{t("taxiLabel")}</span><strong>{t("taxiAction")} <ArrowRight size={15} /></strong><small>{t("externalDemoNote")}</small></a></div></section>

    <section className="trip-bookings-section"><div className="trip-section-heading"><div><p className="card-overline">{t("bookingEyebrow")}</p><h2>{t("bookingRequests")}</h2></div><span>{requests.filter(({ status }) => status === "pending").length} {t("pendingLabel")}</span></div>
      {requests.length ? <div className="trip-booking-list">{requests.map((request) => <article className="trip-booking-card" key={request.id}><div className="trip-booking-top"><div><strong>{request.targetTitle}</strong><small><CalendarDays size={12} />{request.dates?.start ?? "—"} – {request.dates?.end ?? "—"} <Users size={12} />{request.guests ?? 1}</small></div><span className={`trip-booking-status ${request.status}`}>{request.status === "accepted" ? t("acceptedLabel") : request.status === "pending" ? t("pendingLabel") : t("declinedLabel")}</span></div>{request.message && <p>{request.message}</p>}{request.status === "pending" && <button type="button" onClick={() => acceptBooking(request)}>{t("demoAccept")}</button>}{request.status === "accepted" && <small className="trip-demo-accepted">{t("demoAcceptedLabel")}</small>}</article>)}</div> : <p className="trip-no-bookings">{t("noBookings")}</p>}
    </section>
    <div className="trip-footer-actions"><Link href="/trips/new" className="my-trip-secondary"><Plus size={16} />{baseT("buildOwn")}</Link><Link href="/packages" className="my-trip-secondary">{baseT("addPackage")} <ArrowRight size={15} /></Link></div>
  </main>;
}
