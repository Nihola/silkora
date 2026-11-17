"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft, Check, Clock3, Heart, MapPin, Navigation, Plus } from "lucide-react";
import type { NearbyPlace } from "@/data/nearby-places";
import { isOpenNow } from "@/lib/opening-hours";

export function PlaceDetail({ place }: { place: NearbyPlace }) {
  const t = useTranslations("PlaceDetail");
  const nearbyT = useTranslations("Nearby");
  const [saved, setSaved] = useState(false);
  const [added, setAdded] = useState(false);
  const open = isOpenNow(place.openingHours);

  useEffect(() => {
    try {
      const items = JSON.parse(localStorage.getItem("silkora-favorites") ?? "[]") as string[];
      setSaved(items.includes(`place:${place.id}`));
    } catch { setSaved(false); }
  }, [place.id]);

  function toggleSave() {
    let items: string[] = [];
    try { items = JSON.parse(localStorage.getItem("silkora-favorites") ?? "[]") as string[]; } catch { items = []; }
    const key = `place:${place.id}`;
    const updated = saved ? items.filter((item) => item !== key) : [...new Set([...items, key])];
    try { localStorage.setItem("silkora-favorites", JSON.stringify(updated)); } catch { /* Keep this page usable during the demo. */ }
    setSaved(!saved);
  }
  function addToTrip() {
    try {
      const items = JSON.parse(localStorage.getItem("silkora-trip-items") ?? "[]") as { id: string }[];
      if (!items.some((item) => item.id === `place:${place.id}`)) localStorage.setItem("silkora-trip-items", JSON.stringify([...items, { id: `place:${place.id}`, title: place.name, kind: "place", city: place.city, photo: place.photo }]));
    } catch { /* Keep the detail page available without storage. */ }
    setAdded(true);
  }

  return <main className="place-detail-page"><Link href="/explore" className="restaurant-back"><ArrowLeft size={16} />{t("backToMap")}</Link>
    <div className="place-detail-image" style={{ backgroundImage: `url(${place.photo})` }} role="img" aria-label={place.name} />
    <div className="place-detail-title"><div><p className="nearby-eyebrow">{nearbyT(`categories.${place.type}`)}</p><h1>{place.name}</h1></div>{place.rating !== undefined && <strong>★ {place.rating.toFixed(1)} <small>({place.reviewCount})</small></strong>}</div>
    <p className="place-detail-address"><MapPin size={15} />{place.city}</p><p className="place-detail-description">{place.description}</p>
    <div className="place-detail-actions"><button type="button" onClick={toggleSave}>{saved ? <Check size={16} /> : <Heart size={16} />}{saved ? t("saved") : t("save")}</button><button type="button" onClick={addToTrip}>{added ? <Check size={16} /> : <Plus size={16} />}{added ? t("added") : t("addToTrip")}</button></div>
    {added && <p className="restaurant-feedback"><Check size={14} />{t("tripSaved")}</p>}
    <section className="place-detail-info"><h2><Clock3 size={17} />{t("openingHours")}</h2><strong>{place.openingHours.daily}</strong><span className={open ? "hours-current" : "hours-current closed"}>{open ? t("openNow") : t("closedNow")}</span></section>
    {place.fairMin !== undefined && place.fairMax !== undefined && <section className="place-detail-info"><h2>{t("fairPrice")}</h2><strong>{place.fairMin.toLocaleString()}–{place.fairMax.toLocaleString()} UZS</strong></section>}
    {place.touristRisk && <p className="tourist-risk-badge">{nearbyT("touristRisk")}</p>}
    <section className="place-detail-info"><h2><Navigation size={17} />{t("navigate")}</h2><div className="restaurant-navigation-links"><a href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`} target="_blank" rel="noreferrer">Google Maps</a><a href={`https://yandex.com/maps/?rtext=~${place.lat},${place.lng}&rtt=auto`} target="_blank" rel="noreferrer">Yandex Maps</a></div></section>
  </main>;
}
