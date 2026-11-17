"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { ArrowDownRight, ArrowRight, Check, ChevronDown, Compass, MapPin, Search, CloudSun, Sun, CloudRain, Cloud, LocateFixed, UsersRound, Globe2, Sparkles, Utensils, Mountain, Accessibility, Heart, Wallet, X } from "lucide-react";
import { arrivalItems, cityOptions, distanceKm, nearbySeed, packageSeed } from "@/data/home-seed";

type City = (typeof cityOptions)[number];
type Coordinates = { lat: number; lng: number };
type Weather = { temperature: number; code: number; demo: boolean };
type TravelerType = "visitor" | "local";
type Interest = "culture" | "food" | "adventure" | "family" | "budget" | "accessibility" | "halal";

const interestOptions: Interest[] = ["culture", "food", "adventure", "family", "budget", "accessibility", "halal"];
const fallbackWeather: Record<string, Weather> = {
  tashkent: { temperature: 24, code: 1, demo: true }, samarkand: { temperature: 22, code: 2, demo: true },
  bukhara: { temperature: 26, code: 0, demo: true }, khiva: { temperature: 23, code: 1, demo: true },
};

function nearestCity(point: Coordinates): City {
  return cityOptions.reduce((nearest, city) => distanceKm(point, city) < distanceKm(point, nearest) ? city : nearest, cityOptions[0]);
}

function weatherIcon(code: number) {
  if (code === 0) return Sun;
  if (code <= 3) return CloudSun;
  if (code >= 51) return CloudRain;
  return Cloud;
}

export function HomeDashboard() {
  const t = useTranslations("Dashboard");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [city, setCity] = useState<City>(cityOptions[0]);
  const [coordinates, setCoordinates] = useState<Coordinates>(cityOptions[0]);
  const [usingLocation, setUsingLocation] = useState(false);
  const [weather, setWeather] = useState<Weather>(fallbackWeather.tashkent);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [checked, setChecked] = useState<string[]>([]);
  const [onboardingReady, setOnboardingReady] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedLanguage, setSelectedLanguage] = useState(locale);
  const [travelerType, setTravelerType] = useState<TravelerType>("visitor");
  const [interests, setInterests] = useState<Interest[]>(["culture"]);

  useEffect(() => {
    try {
      const complete = window.localStorage.getItem("silkora-onboarding-complete") === "true";
      setOnboardingOpen(!complete);
      const storedCity = window.localStorage.getItem("silkora-city");
      const saved = cityOptions.find((option) => option.key === storedCity);
      if (saved) { setCity(saved); setCoordinates(saved); }
    } catch { setOnboardingOpen(true); }
    setOnboardingReady(true);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation || !navigator.permissions?.query) return;
    try { if (window.localStorage.getItem("silkora-city-manual") === "true") return; } catch { /* Use the available location permission. */ }
    void navigator.permissions.query({ name: "geolocation" as PermissionName }).then((permission) => {
      if (permission.state !== "granted") return;
      navigator.geolocation.getCurrentPosition(({ coords: point }) => {
        const position = { lat: point.latitude, lng: point.longitude };
        const closest = nearestCity(position);
        if (distanceKm(position, closest) <= 50) {
          setCoordinates(position);
          setCity(closest);
          setUsingLocation(true);
        }
      }, () => undefined, { maximumAge: 300_000, timeout: 8_000 });
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setWeatherLoading(true);
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coordinates.lat}&longitude=${coordinates.lng}&current=temperature_2m,weather_code&timezone=auto`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Weather unavailable");
        const result = await response.json() as { current?: { temperature_2m?: number; weather_code?: number } };
        if (typeof result.current?.temperature_2m !== "number" || typeof result.current.weather_code !== "number") throw new Error("Weather data unavailable");
        setWeather({ temperature: Math.round(result.current.temperature_2m), code: result.current.weather_code, demo: false });
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setWeather(fallbackWeather[city.key]);
      })
      .finally(() => { if (!controller.signal.aborted) setWeatherLoading(false); });
    return () => controller.abort();
  }, [city.key, coordinates]);

  const popular = useMemo(() => nearbySeed
    .filter((place) => place.city === city.name)
    .map((place) => ({ ...place, distance: distanceKm(coordinates, place) }))
    .sort((a, b) => a.distance - b.distance), [city.name, coordinates]);

  function chooseCity(key: string) {
    const selected = cityOptions.find((option) => option.key === key) ?? cityOptions[0];
    setCity(selected);
    setCoordinates(selected);
    setUsingLocation(false);
    try { window.localStorage.setItem("silkora-city", selected.key); window.localStorage.setItem("silkora-city-manual", "true"); } catch { /* Keep the city for this session. */ }
  }

  function requestLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(({ coords: point }) => {
      const position = { lat: point.latitude, lng: point.longitude };
      const closest = nearestCity(position);
      if (distanceKm(position, closest) > 50) { setUsingLocation(false); return; }
      setCoordinates(position);
      setCity(closest);
      setUsingLocation(true);
      try { window.localStorage.setItem("silkora-city", closest.key); window.localStorage.setItem("silkora-city-manual", "false"); } catch { /* Location remains available for this session. */ }
    }, () => setUsingLocation(false), { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 });
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = search.trim();
    if (query) router.push(`/explore?q=${encodeURIComponent(query)}&city=${encodeURIComponent(city.name)}`);
  }

  function toggleInterest(interest: Interest) {
    setInterests((current) => current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest]);
  }

  function finishOnboarding() {
    try {
      window.localStorage.setItem("silkora-onboarding-complete", "true");
      window.localStorage.setItem("silkora-traveler-type", travelerType);
      window.localStorage.setItem("silkora-interests", JSON.stringify(interests));
    } catch { /* Preferences still apply for this visit. */ }
    setOnboardingOpen(false);
    if (selectedLanguage !== locale) {
      const segments = pathname.split("/");
      segments[1] = selectedLanguage;
      router.replace(segments.join("/") || `/${selectedLanguage}`);
    }
  }

  const WeatherIcon = weatherIcon(weather.code);

  return <>
    <main className="dashboard">
      <section className="dashboard-welcome">
        <div><p className="dashboard-eyebrow">{t("eyebrow")}</p><h1>{t("greeting")}</h1><p>{t("welcome")}</p>{locale === "uz" && <span className="alphabet-hint">{t("alphabetHint")}</span>}</div>
        <label className="city-picker"><MapPin size={16} /><span className="sr-only">{t("chooseCity")}</span><select value={city.key} onChange={(event) => chooseCity(event.target.value)} aria-label={t("chooseCity")}>{cityOptions.map((option) => <option key={option.key} value={option.key}>{t(`cities.${option.key}`)}</option>)}</select><ChevronDown size={14} /></label>
      </section>

      <form className="home-search" role="search" onSubmit={submitSearch}><Search size={19} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("searchPlaceholder")} aria-label={t("searchPlaceholder")} /><button aria-label={t("searchAction")} type="submit"><ArrowRight size={19} /></button></form>

      <nav className="category-chips" aria-label={t("categoriesLabel")}>
        {(["packages", "restaurants", "attractions", "hotels", "transport"] as const).map((category) => <Link className="category-chip" href={category === "packages" ? "/packages" : category === "restaurants" ? "/restaurants" : `/nearby${category === "transport" ? "" : `?category=${category === "hotels" ? "hotel" : "attraction"}`}`} key={category}>{t(`categories.${category}`)}</Link>)}
      </nav>

      <section className="weather-card" aria-label={t("weatherTitle")}>
        <div className="weather-place"><span className="weather-icon"><WeatherIcon size={21} /></span><div><p className="card-overline">{t("weatherTitle")}</p><strong>{t(`cities.${city.key}`)}</strong><span>{weatherLoading ? t("weatherLoading") : t(`weatherCodes.${weather.code <= 1 ? "clear" : weather.code <= 3 ? "cloudy" : weather.code >= 51 ? "rain" : "overcast"}`)}</span></div></div>
        <div className="weather-reading"><strong>{weather.temperature}°</strong><span>{weather.demo ? t("demoForecast") : t("openMeteo")}</span></div>
      </section>

      <section className="dashboard-section popular-section">
        <div className="dashboard-section-heading"><div><p className="card-overline">{t("nearbyEyebrow")}</p><h2>{t("popularTitle")}</h2></div><button className={`location-action${usingLocation ? " is-on" : ""}`} type="button" onClick={requestLocation}><LocateFixed size={15} />{usingLocation ? t("locationOn") : t("useLocation")}</button></div>
        <p className="section-subtitle">{usingLocation ? t("nearbyFromLocation") : t("nearbyFromCity", { city: t(`cities.${city.key}`) })}</p>
        <div className="popular-grid">{popular.map((place, index) => <Link className={`popular-card popular-card-${index + 1}`} href={`/explore?q=${encodeURIComponent(place.name)}&city=${encodeURIComponent(city.name)}`} key={place.name}>
          <span className="popular-art" aria-hidden="true">{place.kind === "Attraction" ? "✳" : place.kind === "Market" ? "◈" : "☼"}</span><span className="popular-kind">{t(`placeKinds.${place.kind.toLowerCase()}`)}</span><strong>{place.name}</strong><span className="popular-detail">{place.detail}</span><span className="popular-distance"><MapPin size={12} />{place.distance < 1 ? `${Math.max(50, Math.round(place.distance * 1000))} m` : `${place.distance.toFixed(1)} km`}</span>
        </Link>)}</div>
      </section>

      <section className="dashboard-section packages-section">
        <div className="dashboard-section-heading"><div><p className="card-overline">{t("packageEyebrow")}</p><h2>{t("featuredPackages")}</h2></div><Link className="section-more" href="/packages">{t("seeAll")} <ArrowRight size={15} /></Link></div>
        <div className="package-carousel">{packageSeed.map((item) => <Link className={`package-card package-${item.color}`} href={`/packages/${item.id}`} key={item.title}>
          <div className="package-art"><span>{item.mark}</span><Compass size={27} /></div><span className="package-style">{t(`packageStyles.${item.style}`)}</span><strong>{item.title}</strong><span className="package-meta">{item.days} {item.days === 1 ? t("day") : t("days")} · {t(`cities.${item.city}`)}</span><span className="package-price">${item.price} <small>{t("fromPrice")}</small><ArrowRight size={16} /></span>
        </Link>)}</div>
      </section>

      <section className="arrival-card">
        <div className="arrival-heading"><span className="arrival-icon"><Check size={18} /></span><div><p className="card-overline">{t("arrivalEyebrow")}</p><h2>{t("arrivalTitle")}</h2></div><span className="verify-badge">TODO_VERIFY</span></div>
        <p className="arrival-note">{t("arrivalNote")}</p>
        <div className="arrival-list">{arrivalItems.map((item) => <button className={`arrival-item${checked.includes(item) ? " is-checked" : ""}`} type="button" key={item} aria-pressed={checked.includes(item)} onClick={() => setChecked((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item])}><span className="arrival-check">{checked.includes(item) && <Check size={13} />}</span><span>{t(`arrival.${item}`)}</span><span className="arrival-verify">TODO_VERIFY</span></button>)}</div>
      </section>

      <section className="dashboard-section quick-section"><div className="dashboard-section-heading"><div><p className="card-overline">{t("quickEyebrow")}</p><h2>{t("quickTitle")}</h2></div></div>
        <div className="quick-grid">
          <Link href="/trips" className="quick-card quick-trip"><span><Compass size={19} /></span><strong>{t("quick.plan")}</strong><ArrowDownRight size={17} /></Link>
          <Link href="/concierge" className="quick-card quick-concierge"><span><Sparkles size={19} /></span><strong>{t("quick.concierge")}</strong><ArrowDownRight size={17} /></Link>
          <Link href="/hosts" className="quick-card quick-host"><span><UsersRound size={19} /></span><strong>{t("quick.host")}</strong><ArrowDownRight size={17} /></Link>
          <Link href="/toolkit" className="quick-card quick-toolkit"><span><Globe2 size={19} /></span><strong>{t("quick.toolkit")}</strong><ArrowDownRight size={17} /></Link>
        </div>
      </section>
    </main>

    {onboardingReady && onboardingOpen && <div className="onboarding-backdrop"><section className="onboarding-sheet" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className="onboarding-top"><span className="onboarding-brand"><span className="brand-mark">✳</span>Silkora</span><span className="onboarding-step">{t("step", { current: step, total: 2 })}</span><button type="button" className="onboarding-close" aria-label={t("closeOnboarding")} onClick={finishOnboarding}><X size={18} /></button></div>
      <div className="onboarding-progress"><span style={{ width: step === 1 ? "50%" : "100%" }} /></div>
      {step === 1 ? <div className="onboarding-content"><div className="onboarding-symbol"><Globe2 size={23} /></div><p className="card-overline">{t("onboardingEyebrow")}</p><h2 id="onboarding-title">{t("languageTitle")}</h2><p className="onboarding-description">{t("languageDescription")}</p>
        <div className="language-options">{(["en", "ru", "uz"] as const).map((option) => <button key={option} type="button" className={`language-option${selectedLanguage === option ? " selected" : ""}`} onClick={() => setSelectedLanguage(option)} aria-pressed={selectedLanguage === option}><span>{option === "en" ? "English" : option === "ru" ? "Русский" : "O‘zbekcha"}</span><span>{option.toUpperCase()}</span></button>)}</div>
        <button className="onboarding-next" type="button" onClick={() => setStep(2)}>{t("continue")} <ArrowRight size={17} /></button>
      </div> : <div className="onboarding-content"><div className="onboarding-symbol"><UsersRound size={23} /></div><p className="card-overline">{t("onboardingEyebrow")}</p><h2 id="onboarding-title">{t("travelerTitle")}</h2><p className="onboarding-description">{t("travelerDescription")}</p>
        <div className="traveler-options">{(["visitor", "local"] as const).map((option) => { const Icon = option === "visitor" ? Globe2 : Heart; return <button key={option} type="button" className={`traveler-option${travelerType === option ? " selected" : ""}`} onClick={() => setTravelerType(option)} aria-pressed={travelerType === option}><Icon size={19} /><span>{t(`travelerTypes.${option}`)}</span>{travelerType === option && <Check size={16} />}</button>; })}</div>
        <p className="interest-label">{t("interestsTitle")}</p><div className="interest-options">{interestOptions.map((interest) => { const Icon = interest === "food" || interest === "halal" ? Utensils : interest === "adventure" ? Mountain : interest === "accessibility" ? Accessibility : interest === "budget" ? Wallet : interest === "family" ? Heart : Sparkles; const active = interests.includes(interest); return <button key={interest} type="button" className={`interest-option${active ? " selected" : ""}`} onClick={() => toggleInterest(interest)} aria-pressed={active}><Icon size={15} />{t(`interests.${interest}`)}</button>; })}</div>
        <div className="onboarding-footer"><button className="onboarding-back" type="button" onClick={() => setStep(1)}>{t("back")}</button><button className="onboarding-next" type="button" onClick={finishOnboarding}>{t("getStarted")} <ArrowRight size={17} /></button></div>
      </div>}
    </section></div>}
  </>;
}
