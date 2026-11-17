import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, Compass, MapPin, Sparkles } from "lucide-react";
import { nearbyPlaces } from "@/data/nearby-places";
import { travelPackages } from "@/data/packages";

export function CityLanding({ slug }: { slug: string }) {
  const t = useTranslations("CityPage");
  const cityName = t(`cities.${slug}.name`);
  const places = nearbyPlaces.filter((place) => place.city.toLowerCase() === slug);
  const topRestaurants = places.filter((place) => place.type === "restaurant" || place.type === "cafe").slice(0, 3);
  const highlights = places.filter((place) => place.type === "attraction").slice(0, 3);
  const packages = travelPackages.filter((item) => item.cities.some((city) => city.toLowerCase() === slug)).slice(0, 3);

  return <main className="city-landing-page">
    <header className="city-hero"><p className="nearby-eyebrow">{t("eyebrow")}</p><h1>{cityName}</h1><p>{t(`cities.${slug}.intro`)}</p><Link href={`/nearby?category=attraction`} className="city-explore-link">{t("exploreCity")} <ArrowRight size={16} /></Link></header>
    <section className="city-highlights"><div className="city-section-heading"><div><p className="nearby-eyebrow">{t("highlightsEyebrow")}</p><h2>{t("highlights")}</h2></div><Sparkles size={20} /></div><div className="city-highlight-grid">{highlights.map((place) => <Link href={`/places/${place.id}`} key={place.id} className="city-highlight-card" style={{ backgroundImage: `linear-gradient(0deg,rgba(20,27,52,.76),rgba(20,27,52,.05)),url(${place.photo})` }}><span>{t("highlight")}</span><strong>{place.name}</strong><small><MapPin size={12} />{cityName}</small></Link>)}</div></section>
    <section className="city-season-card"><div className="city-season-icon"><Compass size={21} /></div><div><p className="nearby-eyebrow">{t("bestSeason")}</p><h2>{t(`cities.${slug}.season`)}</h2><p>{t(`cities.${slug}.seasonNote`)}</p></div></section>
    <section className="city-content-section"><div className="city-section-heading"><div><p className="nearby-eyebrow">{t("packagesEyebrow")}</p><h2>{t("topPackages")}</h2></div><Link href="/packages">{t("seeAll")} <ArrowRight size={14} /></Link></div><div className="city-package-list">{packages.map((item) => <Link className="city-package-row" href={`/packages/${item.id}`} key={item.id}><span className="city-package-mark">{item.days}d</span><span><strong>{item.title}</strong><small>{item.days} {t("days")} · ${item.priceUsd} {t("demoPrice")}</small></span><ArrowRight size={16} /></Link>)}</div></section>
    <section className="city-content-section"><div className="city-section-heading"><div><p className="nearby-eyebrow">{t("foodEyebrow")}</p><h2>{t("topRestaurants")}</h2></div><Link href={`/restaurants`}>{t("seeAll")} <ArrowRight size={14} /></Link></div><div className="city-restaurant-list">{topRestaurants.map((place) => <Link className="city-restaurant-card" href={`/restaurants/${place.id}`} key={place.id}><span style={{ backgroundImage: `url(${place.photo})` }} /><strong>{place.name}</strong><small>{place.cuisine ?? t("localFood")} · ${"$".repeat(place.priceLevel ?? 1)}</small></Link>)}</div></section>
    <section className="city-tip-grid"><article className="city-tip-card"><p className="nearby-eyebrow">{t("gettingAround")}</p><h2>{t(`cities.${slug}.transportTitle`)}</h2><p>{t(`cities.${slug}.transport`)}</p><Link href="/nearby?category=atm">{t("findUsefulStops")} <ArrowRight size={14} /></Link></article><article className="city-tip-card etiquette"><p className="nearby-eyebrow">{t("localEtiquette")}</p><h2>{t(`cities.${slug}.etiquetteTitle`)}</h2><p>{t(`cities.${slug}.etiquette`)}</p></article></section>
  </main>;
}
