"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock3, MapPin, MessageCircle, Plus, ShieldCheck, Star, Users, X } from "lucide-react";
import type { PackageDay, TravelPackage } from "@/data/packages";

function RouteMap({ day, openLabel }: { day: PackageDay; openLabel: string }) {
  const first = day.stops[0];
  const query = first ? `https://www.openstreetmap.org/?mlat=${first.lat}&mlon=${first.lng}#map=15/${first.lat}/${first.lng}` : "https://www.openstreetmap.org";
  return <div className="route-map-card">
    <div className="route-map" role="img" aria-label={`${day.title} stop map`}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path className="route-map-road" d="M0 21 C24 12 28 32 47 25 S72 14 100 25 M0 77 C18 65 32 84 51 73 S78 86 100 70 M20 0 C14 25 31 42 19 62 S30 83 24 100 M78 0 C68 20 86 36 76 56 S88 79 77 100" />
        <polyline className="route-map-path" points={day.stops.map((stop) => `${stop.x},${stop.y}`).join(" ")} />
        {day.stops.map((stop, stopIndex) => <g key={`${stop.name}-${stopIndex}`} transform={`translate(${stop.x} ${stop.y})`}><circle r="5.4" className="route-pin-halo" /><circle r="3.8" className="route-pin" /><text y="1.4" textAnchor="middle" className="route-pin-number">{stopIndex + 1}</text></g>)}
      </svg>
      <span className="route-map-label route-map-label-a">{day.stops[0]?.name}</span><span className="route-map-label route-map-label-b">{day.stops.at(-1)?.name}</span>
      <a className="route-map-open" href={query} target="_blank" rel="noreferrer">{openLabel} ↗</a>
    </div>
    <ol className="route-stop-list">{day.stops.map((stop, stopIndex) => <li key={`${stop.name}-${stopIndex}`}><span>{stopIndex + 1}</span><div><strong>{stop.name}</strong><small>{stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}</small></div></li>)}</ol>
  </div>;
}

export function PackageDetail({ item }: { item: TravelPackage }) {
  const t = useTranslations("Packages");
  const [saved, setSaved] = useState(false);
  const [added, setAdded] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingSent, setBookingSent] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [guests, setGuests] = useState(1);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const favorites = JSON.parse(localStorage.getItem("silkora-favorites") ?? "[]") as string[];
      setSaved(favorites.includes(item.id));
    } catch { setSaved(false); }
  }, [item.id]);

  function toggleSave() {
    let ids: string[] = [];
    try { ids = JSON.parse(localStorage.getItem("silkora-favorites") ?? "[]") as string[]; } catch { ids = []; }
    const next = saved ? ids.filter((id) => id !== item.id) : Array.from(new Set([...ids, item.id]));
    try { localStorage.setItem("silkora-favorites", JSON.stringify(next)); } catch { /* Keep the save state for this page. */ }
    setSaved(!saved);
  }

  function addToTrip() {
    try {
      const current = JSON.parse(localStorage.getItem("silkora-trip-items") ?? "[]") as { id: string; title?: string; days?: number; cities?: string[]; priceUsd?: number }[];
      if (!current.some((entry) => entry.id === item.id)) {
        current.push({ id: item.id, title: item.title, days: item.days, cities: item.cities, priceUsd: item.priceUsd });
        localStorage.setItem("silkora-trip-items", JSON.stringify(current));
      }
    } catch {
      try { localStorage.setItem("silkora-trip-items", JSON.stringify([{ id: item.id, title: item.title, days: item.days, cities: item.cities, priceUsd: item.priceUsd }])); } catch { /* The demo action remains available in this session. */ }
    }
    setAdded(true);
  }

  function submitBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!startDate || !endDate || endDate < startDate) { setBookingError(t("booking.dateError")); return; }
    const request = { id: globalThis.crypto?.randomUUID?.() ?? `demo-${Date.now()}`, targetType: "package", targetId: item.id, targetTitle: item.title, dates: { start: startDate, end: endDate }, guests, message, status: "pending", demo: true, createdAt: new Date().toISOString() };
    try {
      const current = JSON.parse(localStorage.getItem("silkora-booking-requests") ?? "[]") as unknown[];
      localStorage.setItem("silkora-booking-requests", JSON.stringify([...current, request]));
    } catch { try { localStorage.setItem("silkora-booking-requests", JSON.stringify([request])); } catch { /* No external booking is submitted in this demo. */ } }
    setBookingError("");
    setBookingSent(true);
  }

  return <main className="package-detail-page">
    <Link href="/packages" className="package-back-link"><ArrowLeft size={16} />{t("backToPackages")}</Link>
    <section className="package-hero-detail">
      <div className="package-detail-photo" style={{ backgroundImage: `url(${item.photo})` }} role="img" aria-label={item.title}>
        <span className="catalog-demo-tag">{t("demo")}</span><span className="detail-style-tag">{t(`styles.${item.style}`)}</span>
      </div>
      <div className="package-detail-heading"><div className="detail-title-row"><h1>{item.title}</h1><span className="detail-rating"><Star size={16} fill="currentColor" />{item.rating.toFixed(1)}<small>({item.reviewCount})</small></span></div>
        <div className="detail-meta"><span><MapPin size={14} />{item.cities.map((city) => t(`cities.${city.toLowerCase()}`)).join(" · ")}</span><span><Clock3 size={14} />{t("dayCount", { count: item.days })}</span><span className="detail-demo-price">${item.priceUsd} <small>{t("perPersonDemo")}</small></span></div>
        <p>{item.description}</p>
        <div className="package-actions"><button type="button" className={`package-action-button${saved ? " selected" : ""}`} onClick={toggleSave}>{saved ? <Check size={16} /> : <Star size={16} />}{saved ? t("saved") : t("save")}</button><button type="button" className={`package-action-button${added ? " selected" : ""}`} onClick={addToTrip}>{added ? <Check size={16} /> : <Plus size={16} />}{added ? t("addedToTrip") : t("addToTrip")}</button><button type="button" className="package-book-button" onClick={() => { setBookingOpen(true); setBookingSent(false); }}>{t("requestBooking")} <ArrowRight size={16} /></button></div>
        {added && <p className="action-feedback"><Check size={14} />{t("tripSaved")}</p>}
      </div>
    </section>

    <section className="package-detail-section"><div className="detail-section-heading"><span className="detail-section-icon"><CalendarDays size={17} /></span><div><p className="card-overline">{t("planYourDays")}</p><h2>{t("itinerary")}</h2></div></div>
      <div className="itinerary-list">{item.itinerary.map((day, index) => <article className="itinerary-day" key={day.title}><div className="itinerary-day-number">{index + 1}</div><div className="itinerary-day-content"><h3>{day.title}</h3><p>{day.description}</p><RouteMap day={day} openLabel={t("mapOpen")} /></div></article>)}</div>
    </section>

    <section className="package-detail-section included-section"><div className="detail-section-heading"><span className="detail-section-icon"><Check size={17} /></span><div><p className="card-overline">{t("includedEyebrow")}</p><h2>{t("whatsIncluded")}</h2></div></div><ul className="included-list">{item.includes.map((entry) => <li key={entry}><span><Check size={14} /></span>{entry}</li>)}</ul><p className="package-disclaimer">{t("includedDisclaimer")}</p></section>

    {!!item.reviews.length && <section className="package-detail-section reviews-section"><div className="detail-section-heading"><span className="detail-section-icon review-icon"><MessageCircle size={17} /></span><div><p className="card-overline">{t("travelerNotes")}</p><h2>{t("reviews")}</h2></div><span className="review-score"><Star size={15} fill="currentColor" />{item.rating.toFixed(1)}</span></div>
      <div className="review-list">{item.reviews.map((review, index) => <article className="package-review" key={`${review.traveler}-${index}`}><div className="review-heading"><span className="review-avatar">{review.traveler.slice(-1)}</span><div><strong>{review.traveler}</strong><small>{t("sampleReview")}</small></div><span className="review-stars"><Star size={12} fill="currentColor" />{review.rating}</span></div><p>{review.text}</p></article>)}</div>
    </section>}

    <section className="agency-card"><div className="agency-mark"><ShieldCheck size={21} /></div><div className="agency-info"><p className="card-overline">{t("offeredBy")}</p><h2>{item.agency.name}</h2><p>{item.agency.bio}</p><div className="agency-status"><span className="unverified-dot" />{item.agency.verified ? t("verifiedAgency") : t("demoAgency")}</div></div></section>

    {bookingOpen && <div className="booking-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setBookingOpen(false); }}><section className="booking-sheet" role="dialog" aria-modal="true" aria-labelledby="booking-title"><div className="booking-sheet-top"><div><p className="card-overline">{t("booking.eyebrow")}</p><h2 id="booking-title">{bookingSent ? t("booking.sentTitle") : t("booking.title")}</h2></div><button type="button" className="booking-close" aria-label={t("booking.close")} onClick={() => setBookingOpen(false)}><X size={19} /></button></div>
        {bookingSent ? <div className="booking-confirmation"><span><Check size={22} /></span><strong>{t("booking.sentTitle")}</strong><p>{t("booking.pendingStatus")}</p><p>{t("booking.sentBody")}</p><small>{t("booking.demoLabel")}</small><Link className="my-trip-secondary" href="/trips">{t("booking.viewRequest")} <ArrowRight size={15} /></Link><button className="package-book-button" type="button" onClick={() => setBookingOpen(false)}>{t("booking.done")}</button></div> : <form className="booking-form" onSubmit={submitBooking}>
          <div className="booking-package-summary"><span className="booking-thumb" style={{ backgroundImage: `url(${item.photo})` }} /><div><strong>{item.title}</strong><small>${item.priceUsd} · {t("perPersonDemo")}</small></div></div>
          <div className="booking-dates"><label>{t("booking.startDate")}<input type="date" required value={startDate} onChange={(event) => { setStartDate(event.target.value); setBookingError(""); }} /></label><label>{t("booking.endDate")}<input type="date" required min={startDate || undefined} value={endDate} onChange={(event) => { setEndDate(event.target.value); setBookingError(""); }} /></label></div>
          <label className="booking-field">{t("booking.guests")}<span className="guest-input"><Users size={16} /><input type="number" min={1} max={30} value={guests} onChange={(event) => setGuests(Math.min(30, Math.max(1, Number(event.target.value) || 1)))} /></span></label>
          <label className="booking-field">{t("booking.message")}<textarea rows={3} maxLength={1000} value={message} onChange={(event) => setMessage(event.target.value)} placeholder={t("booking.messagePlaceholder")} /></label>
          {bookingError && <p className="booking-error">{bookingError}</p>}<p className="booking-demo-note">{t("booking.demoLabel")}</p>
          <button className="package-book-button booking-submit" type="submit">{t("booking.submit")} <ArrowRight size={16} /></button>
        </form>}
      </section></div>}
  </main>;
}
