"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { CalendarDays, MapPin } from "lucide-react";
import { LeafletMapView } from "@/components/explore/leaflet-map";
import type { NearbyPlace } from "@/data/nearby-places";
import { travelPackages } from "@/data/packages";

export type SharedTripItem = { id: string; title: string; kind: string; city: string; photo?: string; priceUsd?: number; day: number; packageId?: string; lat?: number; lng?: number };
export type SharedTripData = { title: string; days: number; items: SharedTripItem[] };

function marker(item: SharedTripItem, index: number): NearbyPlace {
  return { id: `shared-${item.id}-${index}`, type: "attraction", name: item.title, city: item.city, lat: item.lat ?? 41.3111, lng: item.lng ?? 69.2797, reviewCount: 0, tags: [], halal: false, vegetarian: false, family: true, openingHours: { daily: "Hours vary" }, photo: item.photo ?? "/images/places/attraction.svg", photos: [item.photo ?? "/images/places/attraction.svg"], description: item.title, reviews: [] };
}

export function SharedTrip({ trip }: { trip: SharedTripData }) {
  const t = useTranslations("SharedTrip");
  const byDay = useMemo(() => Array.from({ length: trip.days }, (_, index) => trip.items.filter((item) => item.day === index + 1)), [trip]);
  const total = trip.items.reduce((sum, item) => sum + (item.priceUsd ?? 0), 0);
  return <main className="shared-trip-page"><header><p className="card-overline">{t("eyebrow")}</p><h1>{trip.title}</h1><p>{t("readOnly")}</p><span><CalendarDays size={14} />{t("dayCount", { count: trip.days })}</span></header><section className="shared-trip-budget"><span>{t("budgetEstimate")}</span><strong>${total} USD</strong></section>
    {byDay.map((items, index) => {
      const points = items.flatMap((item, itemIndex) => {
        if (item.lat !== undefined && item.lng !== undefined) return [marker(item, itemIndex)];
        const pack = item.packageId ? travelPackages.find(({ id }) => id === item.packageId) : undefined;
        return pack?.itinerary[Math.min(index, pack.itinerary.length - 1)]?.stops.map((stop, stopIndex) => marker({ ...item, title: stop.name, lat: stop.lat, lng: stop.lng }, itemIndex * 10 + stopIndex)) ?? [];
      });
      const first = points[0] ?? marker({ id: "city", title: items[0]?.city ?? "Tashkent", kind: "city", city: items[0]?.city ?? "Tashkent", day: index + 1 }, index);
      return <section className="shared-trip-day" key={index}><h2>{t("dayLabel", { day: index + 1 })}</h2>{items.length ? <div className="shared-trip-items">{items.map((item) => <article key={item.id}><span style={{ backgroundImage: `url(${item.photo ?? "/images/places/attraction.svg"})` }} /><div><strong>{item.title}</strong><small><MapPin size={12} />{item.city} · {item.kind}</small></div>{item.priceUsd !== undefined && <b>${item.priceUsd}</b>}</article>)}</div> : <p>{t("emptyDay")}</p>}<details><summary>{t("showMap")}</summary><div className="shared-trip-map"><LeafletMapView places={points.length ? points : [first]} center={[first.lat, first.lng]} selectedId={null} onSelect={() => undefined} mapLabel={t("mapLabel", { day: index + 1 })} mapCaption={t("mapCaption")} /></div></details></section>;
    })}
    <p className="shared-trip-demo-note">{t("demoNote")}</p>
  </main>;
}
