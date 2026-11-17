"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Check, Clock3, Heart, MapPin, Navigation, Plus, ShieldCheck, Star, Utensils } from "lucide-react";
import type { NearbyPlace } from "@/data/nearby-places";
import { isOpenNow } from "@/lib/opening-hours";

type Review = { rating: number; author: string; text: string; demo?: boolean; createdAt?: string };

export function RestaurantDetail({ place }: { place: NearbyPlace }) {
  const t = useTranslations("Restaurant");
  const [photoIndex, setPhotoIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const [added, setAdded] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviews, setReviews] = useState<Review[]>(place.reviews.map((review) => ({ ...review, demo: true })));
  const [reviewMessage, setReviewMessage] = useState("");

  useEffect(() => {
    try {
      const favorites = JSON.parse(localStorage.getItem("silkora-favorites") ?? "[]") as string[];
      setSaved(favorites.includes(`place:${place.id}`));
      const userReviews = JSON.parse(localStorage.getItem(`silkora-reviews-${place.id}`) ?? "[]") as Review[];
      setReviews([...place.reviews.map((review) => ({ ...review, demo: true })), ...userReviews]);
    } catch { setSaved(false); }
  }, [place]);

  const averageRating = useMemo(() => reviews.length ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length : place.rating, [place.rating, reviews]);
  const open = isOpenNow(place.openingHours);

  function toggleSave() {
    let favorites: string[] = [];
    try { favorites = JSON.parse(localStorage.getItem("silkora-favorites") ?? "[]") as string[]; } catch { favorites = []; }
    const key = `place:${place.id}`;
    const next = saved ? favorites.filter((id) => id !== key) : Array.from(new Set([...favorites, key]));
    try { localStorage.setItem("silkora-favorites", JSON.stringify(next)); } catch { /* Keep save available for this page. */ }
    setSaved(!saved);
  }

  function addToTrip() {
    const entry = { id: `place:${place.id}`, title: place.name, kind: "place", city: place.city, photo: place.photo };
    try {
      const items = JSON.parse(localStorage.getItem("silkora-trip-items") ?? "[]") as { id: string }[];
      if (!items.some((item) => item.id === entry.id)) localStorage.setItem("silkora-trip-items", JSON.stringify([...items, entry]));
    } catch { try { localStorage.setItem("silkora-trip-items", JSON.stringify([entry])); } catch { /* Current page state still confirms the action. */ } }
    setAdded(true);
  }

  function submitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = reviewText.trim();
    if (rating < 1 || text.length < 5) { setReviewMessage(t("reviewValidation")); return; }
    const next: Review = { rating, text, author: t("youDemo"), demo: true, createdAt: new Date().toISOString() };
    const all = [...reviews, next];
    setReviews(all);
    try { localStorage.setItem(`silkora-reviews-${place.id}`, JSON.stringify([...all.filter((review) => !place.reviews.some((seed) => seed.text === review.text))])); } catch { /* Show the review for this visit. */ }
    setRating(0); setReviewText(""); setReviewMessage(t("reviewSaved"));
  }

  const googleMaps = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;
  const yandexMaps = `https://yandex.com/maps/?rtext=~${place.lat},${place.lng}&rtt=auto`;

  return <main className="restaurant-detail-page">
    <Link href="/restaurants" className="restaurant-back"><ArrowLeft size={16} />{t("back")}</Link>
    <section className="restaurant-hero">
      <div className="restaurant-gallery">
        <div className="restaurant-main-photo" role="img" aria-label={place.name} style={{ backgroundImage: `url(${place.photos[photoIndex] ?? place.photo})` }}><span className="restaurant-photo-tag">{t("demoPhoto")}</span><button type="button" className="restaurant-photo-next" aria-label={t("nextPhoto")} onClick={() => setPhotoIndex((current) => (current + 1) % place.photos.length)}><ArrowRight size={17} /></button></div>
        <div className="restaurant-thumbnails">{place.photos.map((photo, index) => <button type="button" key={photo} className={photoIndex === index ? "selected" : ""} aria-label={t("photoNumber", { number: index + 1 })} aria-pressed={photoIndex === index} onClick={() => setPhotoIndex(index)} style={{ backgroundImage: `url(${photo})` }} />)}</div>
      </div>
      <div className="restaurant-heading-copy"><div className="restaurant-title-line"><div><p className="nearby-eyebrow">{t(`categories.${place.type}`)}</p><h1>{place.name}</h1></div>{averageRating !== undefined && <span className="restaurant-rating"><Star size={16} fill="currentColor" />{averageRating.toFixed(1)}<small>({reviews.length})</small></span>}</div>
        <p className="restaurant-address"><MapPin size={14} />{t(`cities.${place.city.toLowerCase()}`)}<span>·</span>{place.cuisine ? t(`cuisines.${place.cuisine.toLowerCase()}`) : t(`categories.${place.type}`)}</p>
        <p className="restaurant-description">{place.description}</p>
        <div className="restaurant-badges">{place.rating !== undefined && place.reviewCount > 0 && <span className="local-favorite-badge">✦ {t("localFavorite")}</span>}{place.touristRisk && <span className="tourist-risk-badge">{t("touristRisk")}</span>}<span className={`restaurant-open-badge${open ? "" : " is-closed"}`}><span />{open ? t("openNow") : t("closedNow")}</span></div>
        <div className="restaurant-actions"><button type="button" className={`restaurant-action${saved ? " selected" : ""}`} onClick={toggleSave}>{saved ? <Check size={16} /> : <Heart size={16} />}{saved ? t("saved") : t("save")}</button><button type="button" className={`restaurant-action${added ? " selected" : ""}`} onClick={addToTrip}>{added ? <Check size={16} /> : <Plus size={16} />}{added ? t("added") : t("addToTrip")}</button></div>
        {added && <p className="restaurant-feedback"><Check size={14} />{t("tripSaved")}</p>}
      </div>
    </section>

    <section className="restaurant-info-grid">
      <article className="restaurant-info-card"><div className="restaurant-info-heading"><span><Clock3 size={17} /></span><div><p>{t("hoursEyebrow")}</p><h2>{t("openingHours")}</h2></div></div><div className="restaurant-hours-row"><span>{t("daily")}</span><strong>{place.openingHours.daily}</strong></div><p className={`hours-current${open ? "" : " closed"}`}>{open ? t("openNow") : t("closedNow")}{t("hoursTimezone")}</p></article>
      {place.fairMin !== undefined && place.fairMax !== undefined && <article className="restaurant-info-card fair-price-card"><div className="restaurant-info-heading"><span><BanknoteIcon /></span><div><p>{t("priceEyebrow")}</p><h2>{t("fairPrice")}</h2></div></div><strong className="fair-price-range">{place.fairMin.toLocaleString()}–{place.fairMax.toLocaleString()} <small>UZS</small></strong><p className="fair-price-note">{t("perPerson")}</p></article>}
    </section>

    <section className="restaurant-nav-card"><div className="restaurant-info-heading"><span><Navigation size={17} /></span><div><p>{t("getThereEyebrow")}</p><h2>{t("navigate")}</h2></div></div><p>{t("navigateBody")}</p><div className="restaurant-navigation-links"><a href={googleMaps} target="_blank" rel="noreferrer"><MapPin size={15} />Google Maps <ArrowRight size={14} /></a><a href={yandexMaps} target="_blank" rel="noreferrer"><Navigation size={15} />Yandex Maps <ArrowRight size={14} /></a></div></section>

    <section className="restaurant-reviews-section"><div className="restaurant-section-heading"><div><p className="nearby-eyebrow">{t("reviewsEyebrow")}</p><h2>{t("reviews")}</h2></div><span>{reviews.length}</span></div>
      {reviews.length ? <div className="restaurant-review-list">{reviews.map((review, index) => <article className="restaurant-review" key={`${review.author}-${index}`}><div className="restaurant-review-head"><span className="restaurant-review-avatar">{review.author.slice(0, 1)}</span><div><strong>{review.author}</strong><small>{review.demo ? t("sampleReview") : t("communityReview")}</small></div><span className="restaurant-review-stars"><Star size={12} fill="currentColor" />{review.rating}</span></div><p>{review.text}</p></article>)}</div> : <p className="restaurant-no-reviews">{t("noReviews")}</p>}
    </section>

    <section className="restaurant-review-form-card"><div className="restaurant-info-heading"><span><Utensils size={17} /></span><div><p>{t("shareEyebrow")}</p><h2>{t("writeReview")}</h2></div></div><form className="restaurant-review-form" onSubmit={submitReview}><fieldset><legend>{t("yourRating")}</legend><div className="review-star-input">{[1,2,3,4,5].map((value) => <button key={value} type="button" aria-label={t("chooseRating", { rating: value })} aria-pressed={rating === value} onClick={() => { setRating(value); setReviewMessage(""); }}><Star size={23} fill={rating >= value ? "currentColor" : "none"} /></button>)}</div></fieldset><label>{t("reviewText")}<textarea rows={4} minLength={5} maxLength={1000} value={reviewText} onChange={(event) => { setReviewText(event.target.value); setReviewMessage(""); }} placeholder={t("reviewPlaceholder")} required /></label>{reviewMessage && <p className="review-form-message" role="status">{reviewMessage}</p>}<p className="review-demo-note"><ShieldCheck size={13} />{t("demoReviewNote")}</p><button className="review-submit" type="submit">{t("submitReview")} <ArrowRight size={15} /></button></form></section>
  </main>;
}

function BanknoteIcon() { return <span className="banknote-symbol">{"$"}</span>; }
