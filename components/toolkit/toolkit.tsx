"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowUpRight, Check, Clipboard, MapPinned, Navigation, Search, Volume2 } from "lucide-react";
import { currencyRateUpdated, currencyRates, phrases } from "@/data/toolkit-seed";
import { fairPriceSeed } from "@/data/concierge-seed";

const cityNames = ["Tashkent", "Samarkand", "Bukhara", "Khiva"];
const seasons = ["Spring", "Summer", "Autumn", "Winter"] as const;
type CurrencyCode = (typeof currencyRates)[number]["code"];

export function Toolkit() {
  const t = useTranslations("Toolkit");
  const locale = useLocale() as "en" | "ru" | "uz";
  const [phraseSearch, setPhraseSearch] = useState("");
  const [copied, setCopied] = useState("");
  const [priceSearch, setPriceSearch] = useState("");
  const [city, setCity] = useState("all");
  const [season, setSeason] = useState<(typeof seasons)[number]>("Spring");
  const [amount, setAmount] = useState("1");
  const [from, setFrom] = useState<CurrencyCode>("USD");
  const [to, setTo] = useState<CurrencyCode>("UZS");

  const localizedPhrases = useMemo(() => phrases.filter((phrase) => `${phrase[locale]} ${phrase.en} ${phrase.ru} ${phrase.uz}`.toLowerCase().includes(phraseSearch.toLowerCase())).slice(0, 40), [locale, phraseSearch]);
  const fairPrices = useMemo(() => fairPriceSeed.filter((item) => (city === "all" || item.city === city) && `${item.item} ${item.city}`.toLowerCase().includes(priceSearch.toLowerCase())), [city, priceSearch]);
  const numericAmount = Math.max(0, Number(amount) || 0);
  const fromRate = currencyRates.find((rate) => rate.code === from)?.perUzs ?? 1;
  const toRate = currencyRates.find((rate) => rate.code === to)?.perUzs ?? 1;
  const converted = numericAmount / fromRate * toRate;

  async function copyPhrase(id: string, value: string) {
    try { await navigator.clipboard.writeText(value); setCopied(id); setTimeout(() => setCopied(""), 1800); }
    catch { setCopied(""); }
  }
  function speak(value: string) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(value);
    utterance.lang = { en: "en-US", ru: "ru-RU", uz: "uz-UZ" }[locale];
    window.speechSynthesis.speak(utterance);
  }

  return <main className="toolkit-page">
    <header className="toolkit-heading"><span><Navigation size={22} /></span><div><p className="card-overline">{t("eyebrow")}</p><h1>{t("title")}</h1><p>{t("subtitle")}</p></div></header>
    <nav className="toolkit-jump-links" aria-label={t("title")}>{[["transport", "transportTitle"], ["phrases", "phrasebookTitle"], ["currency", "currencyTitle"], ["prices", "priceTitle"], ["documents", "travelDocsTitle"], ["packing", "packingTitle"], ["etiquette", "etiquetteTitle"]].map(([id, label]) => <a key={id} href={`#${id}`}>{t(label)}</a>)}</nav>

    <section className="toolkit-card" id="transport"><div className="toolkit-title"><MapPinned size={19} /><h2>{t("transportTitle")}</h2></div><div className="transport-grid">
      <article><h3>{t("metroTitle")}</h3><p>{t("metroBody")}</p><a href="https://metrogo.uz/en/map/" target="_blank" rel="noreferrer">{t("metroMap")} <ArrowUpRight size={14} /></a></article>
      <article><h3>{t("trainsTitle")}</h3><p>{t("trainsBody")}</p><a href="https://eticket.uzrailpass.uz/en/home" target="_blank" rel="noreferrer">{t("officialTickets")} <ArrowUpRight size={14} /></a></article>
      <article><h3>{t("taxiTitle")}</h3><p>{t("taxiBody")}</p><a href="https://go.yandex.uz/en_uz/" target="_blank" rel="noreferrer">{t("taxiApp")} <ArrowUpRight size={14} /></a><a href="https://yandex.com/maps/" target="_blank" rel="noreferrer">{t("mapRoutes")} <ArrowUpRight size={14} /></a></article>
      <article><h3>{t("intercityTitle")}</h3><p>{t("intercityBody")}</p><a href="https://eticket.uzrailpass.uz/en/home" target="_blank" rel="noreferrer">{t("officialTickets")} <ArrowUpRight size={14} /></a></article>
    </div></section>

    <section className="toolkit-card" id="phrases"><div className="toolkit-title"><Volume2 size={19} /><h2>{t("phrasebookTitle")}</h2><span>{t("phraseCount", { count: phrases.length })}</span></div><p className="toolkit-muted">{t("phrasebookBody")}</p><label className="toolkit-search"><Search size={16} /><input value={phraseSearch} onChange={(event) => setPhraseSearch(event.target.value)} placeholder={t("searchPhrases")} /></label><div className="phrase-grid">{localizedPhrases.map((phrase) => <article className="phrase-card" key={phrase.key}><div><strong>{phrase[locale]}</strong><small>{phrase.en}</small></div><div className="phrase-actions"><button type="button" onClick={() => void copyPhrase(phrase.key, phrase[locale])} aria-label={t("copy")} title={copied === phrase.key ? t("copied") : t("copy")}>{copied === phrase.key ? <Check size={15} /> : <Clipboard size={15} />}</button><button type="button" onClick={() => speak(phrase[locale])} aria-label={t("speak")} title={t("speak")}><Volume2 size={15} /></button></div></article>)}</div></section>

    <section className="toolkit-card" id="currency"><div className="toolkit-title"><h2>{t("currencyTitle")}</h2></div><p className="toolkit-muted">{t("currencyBody")}</p><div className="currency-form"><label>{t("amount")}<input type="number" min="0" step="any" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} /></label><label>{t("from")}<select value={from} onChange={(event) => setFrom(event.target.value as CurrencyCode)}>{currencyRates.map((rate) => <option key={rate.code} value={rate.code}>{rate.code} · {rate.label}</option>)}</select></label><label>{t("to")}<select value={to} onChange={(event) => setTo(event.target.value as CurrencyCode)}>{currencyRates.map((rate) => <option key={rate.code} value={rate.code}>{rate.code} · {rate.label}</option>)}</select></label></div><div className="currency-result"><small>{from} → {to}</small><strong>{new Intl.NumberFormat(locale, { maximumFractionDigits: to === "UZS" ? 0 : 2 }).format(converted)} {to}</strong><span>{t("rateLabel", { date: currencyRateUpdated })}</span></div></section>

    <section className="toolkit-card" id="prices"><div className="toolkit-title"><h2>{t("priceTitle")}</h2></div><p className="toolkit-muted">{t("priceBody")}</p><div className="price-filter-row"><label className="toolkit-search"><Search size={16} /><input value={priceSearch} onChange={(event) => setPriceSearch(event.target.value)} placeholder={t("searchPrices")} /></label><select aria-label={t("allCities")} value={city} onChange={(event) => setCity(event.target.value)}><option value="all">{t("allCities")}</option>{cityNames.map((name) => <option key={name}>{name}</option>)}</select></div><div className="fair-price-list">{fairPrices.map((item, index) => <article key={`${item.city}-${item.item}-${index}`}><div><strong>{item.item}</strong><small>{item.city} · {item.unit}</small></div><b>{new Intl.NumberFormat(locale).format(item.fairMin)}–{new Intl.NumberFormat(locale).format(item.fairMax)} {item.currency}</b></article>)}{fairPrices.length === 0 && <p className="toolkit-muted">{t("priceBody")}</p>}</div></section>

    <section className="toolkit-card" id="documents"><div className="toolkit-title"><h2>{t("travelDocsTitle")}</h2></div><p className="toolkit-muted">{t("travelDocsBody")}</p><div className="faq-card"><h3>{t("visaQuestion")}</h3><p>{t("visaAnswer")}</p><a href="https://e-visa.gov.uz/" target="_blank" rel="noreferrer">{t("officialEvisa")} <ArrowUpRight size={14} /></a><a href="https://gov.uz/en/mfa/activity_page/o-zbekiston-respublikasi-vizasi" target="_blank" rel="noreferrer">{t("govInfo")} <ArrowUpRight size={14} /></a></div><div className="faq-card"><h3>{t("registrationQuestion")}</h3><p>{t("registrationAnswer")}</p><a href="https://my.gov.uz/en/for-foreigners" target="_blank" rel="noreferrer">{t("govInfo")} <ArrowUpRight size={14} /></a><small>{t("todoVerify")}</small></div></section>

    <section className="toolkit-card" id="packing"><div className="toolkit-title"><h2>{t("packingTitle")}</h2></div><label className="season-select">{t("season")}<select value={season} onChange={(event) => setSeason(event.target.value as (typeof seasons)[number])}>{seasons.map((item) => <option key={item} value={item}>{t(`season${item}`).split(" · ")[0]}</option>)}</select></label><p className="packing-tip">{t(`season${season}`)}</p></section>

    <section className="toolkit-card" id="etiquette"><div className="toolkit-title"><h2>{t("etiquetteTitle")}</h2></div><p className="toolkit-muted">{t("etiquetteBody")}</p><ul className="etiquette-list">{["etiquettePrayer", "etiquetteShoes", "etiquetteGreetings", "etiquetteHospitality", "etiquettePhotos", "etiquetteDress"].map((key) => <li key={key}>{t(key)}</li>)}</ul></section>
  </main>;
}
