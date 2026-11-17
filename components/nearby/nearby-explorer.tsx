"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Accessibility, Banknote, BedDouble, Bike, Check, ChevronDown, Coffee, Compass, LocateFixed, Map as MapIcon, MapPin, Pill, Search, SlidersHorizontal, Star, Utensils, X } from "lucide-react";
import { cityOptions } from "@/data/home-seed";
import { nearbyPlaces, type NearbyCategory, type NearbyPlace } from "@/data/nearby-places";
import { haversineKm, popularityScore } from "@/lib/geo";
import { isOpenNow } from "@/lib/opening-hours";

type Props = { initialCategory?: NearbyCategory };
type Point = { lat: number; lng: number };
const categories: { key: NearbyCategory; icon: typeof Utensils }[] = [
  { key: "restaurant", icon: Utensils }, { key: "cafe", icon: Coffee }, { key: "atm", icon: Banknote },
  { key: "pharmacy", icon: Pill }, { key: "hotel", icon: BedDouble }, { key: "attraction", icon: Compass },
];

function nearestCity(point: Point) {
  return cityOptions.reduce((nearest, city) => haversineKm(point, city) < haversineKm(point, nearest) ? city : nearest, cityOptions[0]);
}

function formatDistance(distance: number) {
  return distance < 1 ? `${Math.max(1, Math.round(distance * 1000))} m` : `${distance.toFixed(1)} km`;
}

function placeHref(place: NearbyPlace) {
  return place.type === "restaurant" || place.type === "cafe" ? `/restaurants/${place.id}` : `/places/${place.id}`;
}

export function NearbyExplorer({ initialCategory = "restaurant" }: Props) {
  const t = useTranslations("Nearby");
  const [category, setCategory] = useState<NearbyCategory>(initialCategory);
  const [cityKey, setCityKey] = useState<(typeof cityOptions)[number]["key"]>(cityOptions[0].key);
  const [origin, setOrigin] = useState<Point>(cityOptions[0]);
  const [usingLocation, setUsingLocation] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [view, setView] = useState<"list" | "map">("list");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [cuisine, setCuisine] = useState("all");
  const [price, setPrice] = useState("all");
  const [halal, setHalal] = useState(false);
  const [vegetarian, setVegetarian] = useState(false);
  const [family, setFamily] = useState(false);
  const [openOnly, setOpenOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedMapPlace, setSelectedMapPlace] = useState<string | null>(null);

  const selectedCity = cityOptions.find(({ key }) => key === cityKey) ?? cityOptions[0];
  const cuisineOptions = [...new Set(nearbyPlaces.filter((place) => place.type === "restaurant" || place.type === "cafe").map((place) => place.cuisine).filter((value): value is string => Boolean(value)))];

  useEffect(() => {
    try {
      const savedCity = cityOptions.find(({ key }) => key === localStorage.getItem("silkora-city"));
      if (savedCity) { setCityKey(savedCity.key); setOrigin(savedCity); }
    } catch { /* Keep Tashkent as the demo city. */ }
  }, []);

  const places = useMemo(() => nearbyPlaces
    .filter((place) => place.city === selectedCity.name && place.type === category)
    .map((place) => {
      const distance = haversineKm(origin, place);
      const score = popularityScore(place.rating ?? 0, place.reviewCount, distance);
      return { ...place, distance, score, open: isOpenNow(place.openingHours) };
    })
    .filter((place) => !query || `${place.name} ${place.cuisine ?? ""} ${place.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()))
    .filter((place) => cuisine === "all" || place.cuisine === cuisine)
    .filter((place) => price === "all" || (price === "budget" ? (place.priceLevel ?? 5) <= 1 : price === "mid" ? place.priceLevel === 2 : (place.priceLevel ?? 0) >= 3))
    .filter((place) => !halal || place.halal)
    .filter((place) => !vegetarian || place.vegetarian)
    .filter((place) => !family || place.family)
    .filter((place) => !openOnly || place.open)
    .sort((a, b) => b.score - a.score || a.distance - b.distance),
  [category, cityKey, origin, cuisine, price, halal, vegetarian, family, openOnly, query]);

  function chooseCity(key: string) {
    const selected = cityOptions.find((option) => option.key === key) ?? cityOptions[0];
    setCityKey(selected.key); setOrigin(selected); setUsingLocation(false); setLocationMessage("");
    try { localStorage.setItem("silkora-city", selected.key); localStorage.setItem("silkora-city-manual", "true"); } catch { /* Session state still updates. */ }
  }

  function requestLocation() {
    if (!navigator.geolocation) { setLocationMessage(t("locationUnavailable")); return; }
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const point = { lat: coords.latitude, lng: coords.longitude };
      const closest = nearestCity(point);
      if (haversineKm(point, closest) > 50) { setLocationMessage(t("locationOutside")); setUsingLocation(false); return; }
      setOrigin(point); setCityKey(closest.key); setUsingLocation(true); setLocationMessage("");
      try { localStorage.setItem("silkora-city", closest.key); localStorage.setItem("silkora-city-manual", "false"); } catch { /* Keep current location in component state. */ }
    }, () => { setUsingLocation(false); setLocationMessage(t("locationDenied")); }, { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 });
  }

  function resetFilters() {
    setCuisine("all"); setPrice("all"); setHalal(false); setVegetarian(false); setFamily(false); setOpenOnly(false); setQuery("");
  }

  const cityPlaces = places;
  const bounds = cityPlaces.reduce((box, place) => ({ minLat: Math.min(box.minLat, place.lat), maxLat: Math.max(box.maxLat, place.lat), minLng: Math.min(box.minLng, place.lng), maxLng: Math.max(box.maxLng, place.lng) }), { minLat: 90, maxLat: -90, minLng: 180, maxLng: -180 });
  const mapPoint = (place: NearbyPlace) => {
    const lngRange = bounds.maxLng - bounds.minLng || 0.01;
    const latRange = bounds.maxLat - bounds.minLat || 0.01;
    return { left: `${10 + ((place.lng - bounds.minLng) / lngRange) * 80}%`, top: `${10 + (1 - (place.lat - bounds.minLat) / latRange) * 80}%` };
  };
  const selectedPlace = places.find(({ id }) => id === selectedMapPlace) ?? places[0];

  return <main className="nearby-page">
    <header className="nearby-heading"><p className="nearby-eyebrow">{t("eyebrow")}</p><div className="nearby-heading-row"><div><h1>{category === "restaurant" ? t("restaurantsTitle") : category === "cafe" ? t("cafesTitle") : t("title")}</h1><p>{t("subtitle")}</p></div><label className="nearby-city-picker"><MapPin size={15} /><span className="sr-only">{t("chooseCity")}</span><select value={cityKey} onChange={(event) => chooseCity(event.target.value)} aria-label={t("chooseCity")}>{cityOptions.map((option) => <option value={option.key} key={option.key}>{t(`cities.${option.key}`)}</option>)}</select><ChevronDown size={13} /></label></div></header>
    <div className="nearby-location-row"><button type="button" className={`nearby-location-button${usingLocation ? " active" : ""}`} onClick={requestLocation}><LocateFixed size={16} />{usingLocation ? t("nearMe") : t("useLocation")}</button><span>{usingLocation ? t("usingLocation") : t("cityCenter", { city: t(`cities.${selectedCity.key}`) })}</span></div>
    {locationMessage && <p className="nearby-location-message" role="status">{locationMessage}</p>}

    <nav className="nearby-category-tabs" aria-label={t("categoriesLabel")}>{categories.map(({ key, icon: Icon }) => <button type="button" key={key} className={category === key ? "selected" : ""} aria-pressed={category === key} onClick={() => { setCategory(key); setCuisine("all"); }}><Icon size={15} /><span>{t(`categories.${key}`)}</span></button>)}</nav>

    <section className="nearby-toolbar"><label className="nearby-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("searchPlaceholder")} aria-label={t("searchPlaceholder")} />{query && <button type="button" onClick={() => setQuery("")} aria-label={t("clearSearch")}><X size={15} /></button>}</label><div className="nearby-view-toggle" aria-label={t("viewLabel")}><button type="button" aria-pressed={view === "list"} className={view === "list" ? "selected" : ""} onClick={() => setView("list")}>{t("listView")}</button><button type="button" aria-pressed={view === "map"} className={view === "map" ? "selected" : ""} onClick={() => setView("map")}><MapIcon size={14} />{t("mapView")}</button></div></section>

    <section className="nearby-filter-shell"><button type="button" className="nearby-filter-toggle" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((value) => !value)}><span><SlidersHorizontal size={15} />{t("filtersTitle")}</span><span className="filter-active-count">{[halal, vegetarian, family, openOnly, price !== "all", cuisine !== "all"].filter(Boolean).length || t("filterCountZero")}</span><ChevronDown size={15} className={filtersOpen ? "rotated" : ""} /></button>
      {filtersOpen && <div className="nearby-filter-panel">{category === "restaurant" || category === "cafe" ? <label className="nearby-filter-field"><span>{t("cuisine")}</span><span className="nearby-select-wrap"><select value={cuisine} onChange={(event) => setCuisine(event.target.value)}><option value="all">{t("anyCuisine")}</option>{cuisineOptions.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={13} /></span></label> : null}
        <label className="nearby-filter-field"><span>{t("price")}</span><span className="nearby-select-wrap"><select value={price} onChange={(event) => setPrice(event.target.value)}><option value="all">{t("anyPrice")}</option><option value="budget">{t("priceLevels.budget")}</option><option value="mid">{t("priceLevels.mid")}</option><option value="premium">{t("priceLevels.premium")}</option></select><ChevronDown size={13} /></span></label>
        <div className="nearby-filter-checks">{([ [halal, setHalal, "halal"], [vegetarian, setVegetarian, "vegetarian"], [family, setFamily, "family"], [openOnly, setOpenOnly, "openNow"] ] as const).map(([checked, setChecked, key]) => <button type="button" key={key} className={`nearby-check-chip${checked ? " selected" : ""}`} aria-pressed={checked} onClick={() => setChecked(!checked)}><span>{checked && <Check size={11} />}</span>{t(`filters.${key}`)}</button>)}</div>
        <button type="button" className="nearby-reset" onClick={resetFilters}>{t("resetFilters")}</button>
      </div>}
    </section>

    <div className="nearby-results-heading"><div><p>{t("resultsEyebrow")}</p><h2>{t("resultCount", { count: places.length, category: t(`categories.${category}`) })}</h2></div><span>{usingLocation ? t("sortedByDistance") : t("popularSort")}</span></div>
    {!places.length ? <section className="nearby-empty"><Compass size={25} /><strong>{t("emptyTitle")}</strong><p>{t("emptyBody")}</p><button type="button" onClick={resetFilters}>{t("resetFilters")}</button></section> : view === "list" ? <div className="nearby-list">{places.map((place) => <PlaceCard key={place.id} place={place} />)}</div> : <section className="nearby-map-panel" aria-label={t("mapView")}>
      <div className="nearby-map-canvas"><span className="map-neighborhood map-neighborhood-one">{t(`cities.${selectedCity.key}`)}</span><span className="map-neighborhood map-neighborhood-two">{t("oldTown")}</span><span className="map-road map-road-one" /><span className="map-road map-road-two" />
        {places.map((place, index) => <button type="button" className={`map-marker${selectedMapPlace === place.id ? " selected" : ""}`} style={mapPoint(place)} key={place.id} onClick={() => setSelectedMapPlace(place.id)} aria-label={place.name}><MapPin size={28} fill="currentColor" /><span>{index + 1}</span></button>)}
        <span className="map-demo-caption">{t("mapDemo")}</span>
      </div>
      {selectedPlace && <PlaceCard place={selectedPlace} compact />}
    </section>}
  </main>;
}

export function PlaceCard({ place, compact = false, destination }: { place: NearbyPlace & { distance?: number; open?: boolean }; compact?: boolean; destination?: string }) {
  const t = useTranslations("Nearby");
  const href = destination ?? placeHref(place);
  const isFood = place.type === "restaurant" || place.type === "cafe";
  return <article className={`nearby-place-card${compact ? " compact" : ""}`}>
    <Link href={href} className="nearby-place-photo" style={{ backgroundImage: `url(${place.photo})` }} aria-label={t("viewPlace", { name: place.name })}><span className="nearby-photo-category">{t(`categories.${place.type}`)}</span><span className="nearby-distance-badge">{formatDistance(place.distance ?? 0)}</span></Link>
    <div className="nearby-place-copy"><div className="nearby-place-meta"><span>{place.cuisine ? t(`cuisines.${place.cuisine.toLowerCase()}`) : t(`categories.${place.type}`)}</span>{place.rating !== undefined && <span className="nearby-rating"><Star size={12} fill="currentColor" />{place.rating.toFixed(1)} <small>({place.reviewCount})</small></span>}</div>
      <Link href={href} className="nearby-place-name">{place.name}</Link><p className="nearby-place-description">{place.description}</p>
      <div className="nearby-place-tags">{place.rating !== undefined && popularityScore(place.rating, place.reviewCount, place.distance ?? 0) >= 2.2 ? <span className="favorite-tag">✦ {t("localFavorite")}</span> : null}{place.touristRisk && <span className="risk-tag">{t("touristRisk")}</span>}{place.open !== undefined && <span className={`open-tag${place.open ? "" : " closed"}`}>{place.open ? t("openNowLabel") : t("closedLabel")}</span>}</div>
      <div className="nearby-place-footer">{isFood && <span className="nearby-price-level">{place.priceLevel ? "$".repeat(place.priceLevel) : "—"}<small>{place.priceLevel ? t("priceLevels.short") : ""}</small></span>}<Link href={href} className="nearby-card-link">{t("viewDetails")} <span>›</span></Link></div>
    </div>
  </article>;
}
