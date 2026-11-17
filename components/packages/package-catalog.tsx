"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, ChevronDown, Compass, MapPin, RotateCcw, SlidersHorizontal, Star } from "lucide-react";
import { packageCities, packageSeasons, packageStyles, travelPackages } from "@/data/packages";

type SortKey = "popular" | "price" | "rating" | "duration";

export function PackageCatalog() {
  const t = useTranslations("Packages");
  const [city, setCity] = useState("all");
  const [duration, setDuration] = useState("all");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1500);
  const [style, setStyle] = useState("all");
  const [season, setSeason] = useState("all");
  const [sort, setSort] = useState<SortKey>("popular");

  const packages = useMemo(() => {
    const filtered = travelPackages.filter((item) => {
      const cityMatch = city === "all" || item.cities.includes(city);
      const durationMatch = duration === "all" || (duration === "short" ? item.days <= 2 : duration === "medium" ? item.days >= 3 && item.days <= 4 : item.days >= 5);
      const priceMatch = item.priceUsd >= minPrice && item.priceUsd <= maxPrice;
      const styleMatch = style === "all" || item.style === style;
      const seasonMatch = season === "all" || item.season.includes(season);
      return cityMatch && durationMatch && priceMatch && styleMatch && seasonMatch;
    });
    return filtered.sort((a, b) => sort === "price" ? a.priceUsd - b.priceUsd
      : sort === "rating" ? b.rating - a.rating
        : sort === "duration" ? a.days - b.days
          : b.popularity - a.popularity);
  }, [city, duration, maxPrice, minPrice, season, sort, style]);

  function resetFilters() {
    setCity("all"); setDuration("all"); setMinPrice(0); setMaxPrice(1500); setStyle("all"); setSeason("all"); setSort("popular");
  }

  return <main className="packages-page">
    <header className="packages-heading"><div className="packages-heading-mark"><Compass size={23} /></div><p className="card-overline">{t("eyebrow")}</p><h1>{t("title")}</h1><p>{t("subtitle")}</p><Link href="/trips/new" className="build-own-link">{t("buildOwn")} <ArrowRight size={16} /></Link></header>

    <section className="package-filters" aria-label={t("filtersTitle")}>
      <div className="filter-heading"><span><SlidersHorizontal size={16} />{t("filtersTitle")}</span><button type="button" onClick={resetFilters}><RotateCcw size={13} />{t("reset")}</button></div>
      <div className="filter-grid">
        <label className="package-filter"><span>{t("city")}</span><span className="select-wrap"><MapPin size={14} /><select value={city} onChange={(event) => setCity(event.target.value)}><option value="all">{t("anyCity")}</option>{packageCities.map((item) => <option value={item} key={item}>{t(`cities.${item.toLowerCase()}`)}</option>)}</select><ChevronDown size={14} /></span></label>
        <label className="package-filter"><span>{t("duration")}</span><span className="select-wrap"><select value={duration} onChange={(event) => setDuration(event.target.value)}><option value="all">{t("anyDuration")}</option><option value="short">{t("durations.short")}</option><option value="medium">{t("durations.medium")}</option><option value="long">{t("durations.long")}</option></select><ChevronDown size={14} /></span></label>
        <label className="package-filter"><span>{t("style")}</span><span className="select-wrap"><select value={style} onChange={(event) => setStyle(event.target.value)}><option value="all">{t("anyStyle")}</option>{packageStyles.map((item) => <option value={item} key={item}>{t(`styles.${item}`)}</option>)}</select><ChevronDown size={14} /></span></label>
        <label className="package-filter"><span>{t("season")}</span><span className="select-wrap"><select value={season} onChange={(event) => setSeason(event.target.value)}><option value="all">{t("anySeason")}</option>{packageSeasons.map((item) => <option value={item} key={item}>{t(`seasons.${item}`)}</option>)}</select><ChevronDown size={14} /></span></label>
      </div>
      <div className="filter-bottom"><fieldset className="price-range"><legend>{t("priceRange")}</legend><label><span>{t("minPrice")}</span><span className="price-input"><span>$</span><input aria-label={t("minPrice")} type="number" min={0} max={1500} step={25} value={minPrice} onChange={(event) => setMinPrice(Math.min(Number(event.target.value) || 0, maxPrice))} /></span></label><span className="price-divider">—</span><label><span>{t("maxPrice")}</span><span className="price-input"><span>$</span><input aria-label={t("maxPrice")} type="number" min={0} max={1500} step={25} value={maxPrice} onChange={(event) => setMaxPrice(Math.max(Number(event.target.value) || 0, minPrice))} /></span></label><small>{t("priceDemo")}</small></fieldset>
        <label className="sort-control"><span>{t("sortBy")}</span><span className="select-wrap"><select value={sort} onChange={(event) => setSort(event.target.value as SortKey)}><option value="popular">{t("sort.popular")}</option><option value="price">{t("sort.price")}</option><option value="rating">{t("sort.rating")}</option><option value="duration">{t("sort.duration")}</option></select><ChevronDown size={14} /></span></label></div>
    </section>

    <section className="package-results"><div className="results-heading"><div><p className="card-overline">{t("curated")}</p><h2>{t("resultsTitle")}</h2></div><span>{t("resultCount", { count: packages.length })}</span></div>
      {packages.length ? <div className="package-list-grid">{packages.map((item) => <article className="catalog-package-card" key={item.id}>
        <Link className="catalog-package-photo" href={`/packages/${item.id}`} style={{ backgroundImage: `url(${item.photo})` }} aria-label={t("viewPackage", { title: item.title })}><span className="catalog-photo-city">{item.cities.map((name) => t(`cities.${name.toLowerCase()}`)).join(" · ")}</span><span className="catalog-demo-tag">{t("demo")}</span></Link>
        <div className="catalog-package-copy"><div className="catalog-card-top"><span className="style-tag">{t(`styles.${item.style}`)}</span><span className="catalog-rating"><Star size={14} fill="currentColor" />{item.rating.toFixed(1)} <small>({item.reviewCount || 0})</small></span></div>
          <Link href={`/packages/${item.id}`} className="catalog-package-title">{item.title}</Link><p className="catalog-package-description">{item.description}</p>
          <div className="catalog-card-bottom"><span className="catalog-duration"><Compass size={14} />{t("dayCount", { count: item.days })}</span><span className="catalog-price"><strong>${item.priceUsd}</strong><small>{t("perPersonDemo")}</small></span></div>
          <Link className="catalog-view-link" href={`/packages/${item.id}`}>{t("viewDetails")} <ArrowRight size={15} /></Link>
        </div>
      </article>)}</div> : <div className="packages-empty"><Compass size={26} /><strong>{t("emptyTitle")}</strong><p>{t("emptyBody")}</p><button type="button" onClick={resetFilters}>{t("resetFilters")}</button></div>}
    </section>
  </main>;
}
