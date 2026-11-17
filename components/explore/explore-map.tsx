"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Banknote, BedDouble, Compass, Coffee, LocateFixed, MapPin, Pill, Search, Utensils } from "lucide-react";
import { cityOptions } from "@/data/home-seed";
import { nearbyPlaces, type NearbyCategory, type NearbyPlace } from "@/data/nearby-places";
import { haversineKm } from "@/lib/geo";
import { isOpenNow } from "@/lib/opening-hours";
import { PlaceCard } from "@/components/nearby/nearby-explorer";
import { LeafletMapView } from "@/components/explore/leaflet-map";

const types: { key: NearbyCategory; icon: typeof Utensils }[] = [
  { key: "restaurant", icon: Utensils }, { key: "cafe", icon: Coffee }, { key: "atm", icon: Banknote },
  { key: "pharmacy", icon: Pill }, { key: "hotel", icon: BedDouble }, { key: "attraction", icon: Compass },
];
type Point = { lat: number; lng: number };
function findClosestCity(point: Point) {
  return cityOptions.reduce((nearest, city) => haversineKm(point, city) < haversineKm(point, nearest) ? city : nearest, cityOptions[0]);
}

export function ExploreMap() {
  const t = useTranslations("Explore");
  const nearbyT = useTranslations("Nearby");
  const [cityKey, setCityKey] = useState<(typeof cityOptions)[number]["key"]>(cityOptions[0].key);
  const [origin, setOrigin] = useState<Point>(cityOptions[0]);
  const [usingLocation, setUsingLocation] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [type, setType] = useState<NearbyCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [cuisine, setCuisine] = useState("all");
  const [price, setPrice] = useState("all");
  const [halal, setHalal] = useState(false);
  const [vegetarian, setVegetarian] = useState(false);
  const [family, setFamily] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedCity = cityOptions.find(({ key }) => key === cityKey) ?? cityOptions[0];
  const cuisineOptions = [...new Set(nearbyPlaces.filter((place) => place.city === selectedCity.name).map(({ cuisine }) => cuisine).filter((value): value is string => Boolean(value)))];
  const places = useMemo(() => nearbyPlaces.filter((place) => place.city === selectedCity.name)
    .filter((place) => type === "all" || place.type === type)
    .filter((place) => !search || `${place.name} ${place.cuisine ?? ""} ${place.tags.join(" ")}`.toLowerCase().includes(search.toLowerCase()))
    .filter((place) => cuisine === "all" || place.cuisine === cuisine)
    .filter((place) => price === "all" || (price === "budget" ? (place.priceLevel ?? 5) <= 1 : price === "mid" ? place.priceLevel === 2 : (place.priceLevel ?? 0) >= 3))
    .filter((place) => !halal || place.halal).filter((place) => !vegetarian || place.vegetarian)
    .filter((place) => !family || place.family).filter((place) => !open || isOpenNow(place.openingHours))
    .map((place) => ({ ...place, distance: haversineKm(origin, place) }))
    .sort((a, b) => haversineKm(origin, a) - haversineKm(origin, b)),
  [selectedCity.name, type, search, cuisine, price, halal, vegetarian, family, open, origin]);
  const center = useMemo<[number, number]>(() => [origin.lat, origin.lng], [origin.lat, origin.lng]);
  const selectedPlace = places.find(({ id }) => id === selectedId) ?? null;

  useEffect(() => {
    try {
      const saved = cityOptions.find(({ key }) => key === localStorage.getItem("silkora-city"));
      if (saved) { setCityKey(saved.key); setOrigin(saved); }
    } catch { /* Tashkent remains the seeded city fallback. */ }
  }, []);

  function chooseCity(key: string) {
    const city = cityOptions.find((option) => option.key === key) ?? cityOptions[0];
    setCityKey(city.key); setOrigin(city); setUsingLocation(false); setSelectedId(null); setCuisine("all");
    try { localStorage.setItem("silkora-city", city.key); } catch { /* Keep the selected city for this visit. */ }
  }

  function locate() {
    if (!navigator.geolocation) { setLocationMessage(nearbyT("locationUnavailable")); return; }
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const point = { lat: coords.latitude, lng: coords.longitude };
      const city = findClosestCity(point);
      if (haversineKm(point, city) > 50) { setLocationMessage(nearbyT("locationOutside")); return; }
      setOrigin(point); setCityKey(city.key); setUsingLocation(true); setLocationMessage("");
    }, () => { setUsingLocation(false); setLocationMessage(nearbyT("locationDenied")); }, { timeout: 10_000, maximumAge: 300_000 });
  }

  return <main className="explore-page">
    <header className="explore-heading"><p className="nearby-eyebrow">{t("eyebrow")}</p><div className="explore-title-row"><div><h1>{t("title")}</h1><p>{t("subtitle")}</p></div><label className="nearby-city-picker"><MapPin size={15} /><span className="sr-only">{nearbyT("chooseCity")}</span><select value={cityKey} onChange={(event) => chooseCity(event.target.value)} aria-label={nearbyT("chooseCity")}>{cityOptions.map((city) => <option value={city.key} key={city.key}>{nearbyT(`cities.${city.key}`)}</option>)}</select></label></div>
      <div className="explore-tools"><label className="nearby-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("searchPlaceholder")} aria-label={t("searchPlaceholder")} /></label><button className={`nearby-location-button${usingLocation ? " active" : ""}`} type="button" onClick={locate}><LocateFixed size={16} />{usingLocation ? nearbyT("nearMe") : nearbyT("useLocation")}</button></div>
      <Link className="explore-city-guide-link" href={`/city/${cityKey}`}>{t("cityGuide", { city: nearbyT(`cities.${cityKey}`) })} <span>→</span></Link>
      {locationMessage && <p className="nearby-location-message" role="status">{locationMessage}</p>}
    </header>
    <nav className="explore-type-chips" aria-label={t("typeFilters")}><button type="button" aria-pressed={type === "all"} className={type === "all" ? "selected" : ""} onClick={() => { setType("all"); setSelectedId(null); }}>{t("allTypes")}</button>{types.map(({ key, icon: Icon }) => <button type="button" key={key} aria-pressed={type === key} className={type === key ? "selected" : ""} onClick={() => { setType(key); setSelectedId(null); }}><Icon size={14} />{nearbyT(`categories.${key}`)}</button>)}</nav>
    <details className="explore-filter-details"><summary>{nearbyT("filtersTitle")} <span>{nearbyT("filterCountZero")}</span></summary><div className="explore-filter-grid">
      <label>{nearbyT("cuisine")}<select value={cuisine} onChange={(event) => setCuisine(event.target.value)}><option value="all">{nearbyT("anyCuisine")}</option>{cuisineOptions.map((item) => <option value={item} key={item}>{nearbyT(`cuisines.${item.toLowerCase()}`)}</option>)}</select></label>
      <label>{nearbyT("price")}<select value={price} onChange={(event) => setPrice(event.target.value)}><option value="all">{nearbyT("anyPrice")}</option><option value="budget">{nearbyT("priceLevels.budget")}</option><option value="mid">{nearbyT("priceLevels.mid")}</option><option value="premium">{nearbyT("priceLevels.premium")}</option></select></label>
      {([[halal, setHalal, "halal"], [vegetarian, setVegetarian, "vegetarian"], [family, setFamily, "family"], [open, setOpen, "openNow"]] as const).map(([checked, setChecked, key]) => <button type="button" className={`explore-filter-check${checked ? " selected" : ""}`} aria-pressed={checked} key={key} onClick={() => setChecked(!checked)}><span>{checked ? "✓" : ""}</span>{nearbyT(`filters.${key}`)}</button>)}
    </div></details>
    <section className="explore-map-section"><LeafletMapView places={places} center={center} onSelect={setSelectedId} selectedId={selectedId} mapLabel={t("mapLabel")} mapCaption={t("mapCaption")} /><p className="explore-result-count">{t("placeCount", { count: places.length, city: nearbyT(`cities.${selectedCity.key}`) })}</p></section>
    {selectedPlace && <div className="explore-sheet-backdrop" role="presentation" onClick={() => setSelectedId(null)}><section className="explore-bottom-sheet" role="dialog" aria-modal="true" aria-label={selectedPlace.name} onClick={(event) => event.stopPropagation()}><div className="explore-sheet-handle" /><div className="explore-sheet-heading"><strong>{t("selectedPlace")}</strong><button type="button" onClick={() => setSelectedId(null)} aria-label={t("closePreview")}>×</button></div><PlaceCard place={selectedPlace} compact destination={`/places/${selectedPlace.id}`} /></section></div>}
  </main>;
}

export type { NearbyPlace };
