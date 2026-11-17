"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Check, Languages, MapPin, ShieldCheck, Sparkles, X } from "lucide-react";
import { hostSeed, type HostProfile } from "@/data/hosts";
import { scoreMatch, type HostNeed, type MatchTraveler } from "@/lib/host-match";

const cities = ["Tashkent", "Samarkand", "Bukhara", "Khiva", "Nurata"];
const languages = ["English", "Russian", "Uzbek", "Tajik", "Karakalpak"];
const interests = ["food", "history", "architecture", "crafts", "markets", "photography", "family", "nature", "coffee", "village-life"];
const needs: HostNeed[] = ["wheelchair", "womenSafe", "halal", "vegetarian", "family", "budget"];
type Quiz = MatchTraveler & { city: string };
const initialQuiz: Quiz = { city: "all", languages: ["English"], interests: [], maxPrice: 25, needs: [], preferRural: false, preferWomenRun: false };

function getUserId() {
  let value = localStorage.getItem("silkora-chat-user-id");
  if (!value) { value = crypto.randomUUID(); localStorage.setItem("silkora-chat-user-id", value); }
  return value;
}

export function HostBrowser({ hostId }: { hostId?: string }) {
  const t = useTranslations("Hosts");
  const locale = useLocale();
  const [hosts, setHosts] = useState(hostSeed);
  const [quiz, setQuiz] = useState<Quiz>(initialQuiz);
  const [step, setStep] = useState(0);
  const [started, setStarted] = useState(false);
  const [requestHost, setRequestHost] = useState<HostProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const selectedHost = hosts.find((host) => host.id === hostId);

  useEffect(() => { let live = true; void fetch("/api/hosts").then((response) => response.json()).then((data: { hosts?: HostProfile[] }) => { if (live && data.hosts?.length) setHosts(data.hosts); }).catch(() => undefined).finally(() => { if (live) setLoading(false); }); return () => { live = false; }; }, []);

  const matches = useMemo(() => hosts.filter((host) => quiz.city === "all" || host.city === quiz.city).map((host) => ({ host, match: scoreMatch(quiz, host) })).sort((a, b) => b.match.score - a.match.score).slice(0, 5), [hosts, quiz]);
  const activeProfile = hostId ? selectedHost : null;

  function toggle(field: "languages" | "interests" | "needs", value: string) {
    setQuiz((current) => { const currentValues = current[field] as string[]; const next = currentValues.includes(value) ? currentValues.filter((item) => item !== value) : [...currentValues, value]; return { ...current, [field]: next }; });
  }

  if (hostId) return <main className="hosts-page"><Link className="host-back-link" href="/hosts">{t("backToMatches")}</Link>{loading ? <p>{t("loading")}</p> : activeProfile ? <HostProfileView host={activeProfile} t={t} locale={locale} onRequest={() => setRequestHost(activeProfile)} /> : <div className="hosts-empty"><h1>{t("notFound")}</h1></div>}{requestHost && <HostBookingSheet host={requestHost} t={t} onClose={() => setRequestHost(null)} onComplete={(message) => { setRequestHost(null); setNotice(message); }} />}{notice && <p className="host-notice" role="status"><Check size={16} />{notice}</p>}</main>;

  const questionTitle = ["cityQuestion", "languageQuestion", "interestQuestion", "budgetQuestion", "needsQuestion", "preferenceQuestion"][step];
  return <main className="hosts-page"><header className="hosts-heading"><span><Languages size={22} /></span><div><p className="card-overline">{t("eyebrow")}</p><h1>{t("title")}</h1><p>{t("subtitle")}</p></div></header>
    {notice && <p className="host-notice" role="status"><Check size={16} />{notice}</p>}{error && <p className="host-error" role="alert">{error}</p>}
    {!started && <section className="host-quiz-start"><span><Sparkles size={20} /></span><h2>{t("quizTitle")}</h2><p>{t("quizIntro")}</p><button type="button" onClick={() => { setStarted(true); setStep(0); }}>{t("startQuiz")} <ArrowRight size={15} /></button></section>}
    {started && <section className="host-quiz-card"><div className="host-quiz-progress"><span>{t("questionProgress", { current: step + 1, total: 6 })}</span><div><i style={{ width: `${((step + 1) / 6) * 100}%` }} /></div></div><h2>{t(questionTitle)}</h2>
      {step === 0 && <div className="host-choice-grid">{["all", ...cities].map((value) => <button className={quiz.city === value ? "selected" : ""} type="button" key={value} onClick={() => setQuiz({ ...quiz, city: value })}>{value === "all" ? t("anyCity") : value}</button>)}</div>}
      {step === 1 && <ChoiceGrid values={languages} field="languages" selected={quiz.languages} toggle={toggle} t={t} />}
      {step === 2 && <ChoiceGrid values={interests} field="interests" selected={quiz.interests} toggle={toggle} t={t} />}
      {step === 3 && <div className="host-choice-grid">{[15, 20, 30, 50, 0].map((price) => <button className={quiz.maxPrice === price ? "selected" : ""} type="button" key={price} onClick={() => setQuiz({ ...quiz, maxPrice: price })}>{price ? t("priceLimit", { price }) : t("anyBudget")}</button>)}</div>}
      {step === 4 && <ChoiceGrid values={needs} field="needs" selected={quiz.needs} toggle={toggle} t={t} />}
      {step === 5 && <div className="host-choice-grid"><button className={quiz.preferRural ? "selected" : ""} type="button" onClick={() => setQuiz({ ...quiz, preferRural: !quiz.preferRural })}>{t("ruralOption")}</button><button className={quiz.preferWomenRun ? "selected" : ""} type="button" onClick={() => setQuiz({ ...quiz, preferWomenRun: !quiz.preferWomenRun })}>{t("womenRunOption")}</button><button type="button" onClick={() => setQuiz({ ...quiz, preferRural: false, preferWomenRun: false })}>{t("noPreference")}</button></div>}
      <div className="host-quiz-actions">{step > 0 && <button type="button" onClick={() => setStep(step - 1)}>{t("previous")}</button>}{step < 5 ? <button type="button" onClick={() => setStep(step + 1)}>{t("next")}</button> : <button type="button" onClick={() => { setStarted(false); setNotice(t("matchesReady")); }}>{t("showMatches")}</button>}</div>
    </section>}
    {(!started || step === 5) && <section className="host-matches"><div className="host-section-title"><div><p className="card-overline">{t("matchEyebrow")}</p><h2>{t("matchTitle")}</h2></div><span>{t("topFive")}</span></div>{loading && <p>{t("loading")}</p>}{matches.map(({ host, match }) => <HostMatchCard key={host.id} host={host} score={match.score} reasons={match.reasons.map((reason) => reason.text)} t={t} onRequest={() => setRequestHost(host)} />)}{!loading && !matches.length && <p>{t("noMatches")}</p>}</section>}
    {requestHost && <HostBookingSheet host={requestHost} t={t} onClose={() => setRequestHost(null)} onComplete={(message) => { setRequestHost(null); setNotice(message); }} />}
  </main>;
}

function ChoiceGrid({ values, field, selected, toggle, t }: { values: string[]; field: "languages" | "interests" | "needs"; selected: string[]; toggle: (field: "languages" | "interests" | "needs", value: string) => void; t: ReturnType<typeof useTranslations> }) {
  return <div className="host-choice-grid">{values.map((value) => <button className={selected.includes(value) ? "selected" : ""} type="button" key={value} onClick={() => toggle(field, value)}>{t(`${field}.${value}`)}</button>)}</div>;
}

function HostMatchCard({ host, score, reasons, t, onRequest }: { host: HostProfile; score: number; reasons: string[]; t: ReturnType<typeof useTranslations>; onRequest: () => void }) {
  return <article className="host-match-card"><Link href={`/hosts/${host.id}`} className="host-avatar" style={{ backgroundImage: `url(${host.photo})` }} aria-label={host.name} /><div className="host-match-copy"><div className="host-name-row"><Link href={`/hosts/${host.id}`}><h3>{host.name}</h3></Link>{host.verified && <span className="host-verified"><ShieldCheck size={12} />{t("verified")}</span>}</div><p className="host-location"><MapPin size={12} />{host.city} · ${host.price} {t("perPerson")}</p><p>{host.vibe}</p><strong className="host-score">{score}% {t("match")}</strong><ul>{reasons.slice(0, 4).map((reason, index) => <li key={`${host.id}-${index}`}>{reason}</li>)}</ul><div className="host-card-actions"><Link href={`/hosts/${host.id}`}>{t("viewProfile")} <ArrowRight size={13} /></Link><button type="button" onClick={onRequest}>{t("requestStay")}</button></div></div></article>;
}

function HostProfileView({ host, t, locale, onRequest }: { host: HostProfile; t: ReturnType<typeof useTranslations>; locale: string; onRequest: () => void }) {
  return <article className="host-profile-card"><div className="host-profile-hero" style={{ backgroundImage: `url(${host.photo})` }} /><p className="card-overline">{t("hostProfile")}</p><h1>{host.name}</h1><p className="host-location"><MapPin size={14} />{host.city} · ${host.price} {t("perPerson")}</p>{host.verified && <span className="host-verified"><ShieldCheck size={13} />{t("verified")}</span>}<p>{host.bio}</p><h2>{t("languageListTitle")}</h2><p>{host.languages.join(" · ")}</p><h2>{t("interestListTitle")}</h2><p>{host.interests.map((interest) => t(`interests.${interest}`)).join(" · ")}</p><h2>{t("accessibility")}</h2><p>{Object.entries(host.accessibility ?? {}).filter(([, supported]) => supported).map(([need]) => t(`needs.${need}`)).join(" · ") || t("askHost")}</p><p className="host-data-note">{t("priceNote", { locale })}</p><button type="button" className="host-primary-button" onClick={onRequest}>{t("requestStayExperience")}</button></article>;
}

function HostBookingSheet({ host, t, onClose, onComplete }: { host: HostProfile; t: ReturnType<typeof useTranslations>; onClose: () => void; onComplete: (message: string) => void }) {
  const [requestType, setRequestType] = useState<"stay" | "experience">("experience");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [guests, setGuests] = useState(1);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const userId = getUserId();
      const response = await fetch("/api/hosts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, hostId: host.id, requestType, startDate, endDate, guests, message }) });
      const result = await response.json() as { error?: string; demo?: boolean };
      if (!response.ok) throw new Error(result.error || t("bookingError"));
      onComplete(result.demo ? t("demoRequestSent") : t("pendingRequestSent"));
    } catch (caught) { setError(caught instanceof Error ? caught.message : t("bookingError")); }
    finally { setBusy(false); }
  }
  return <div className="host-sheet-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="host-booking-sheet" role="dialog" aria-modal="true" aria-labelledby="host-booking-title"><button type="button" className="host-sheet-close" onClick={onClose} aria-label={t("close")}><X size={18} /></button><p className="card-overline">{t("requestBooking")}</p><h2 id="host-booking-title">{host.name}</h2><form onSubmit={(event) => void submit(event)}><label>{t("requestType")}<select value={requestType} onChange={(event) => setRequestType(event.target.value as "stay" | "experience")}><option value="experience">{t("experience")}</option><option value="stay">{t("stay")}</option></select></label><div className="host-date-fields"><label>{t("startDate")}<input type="date" required value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label><label>{t("endDate")}<input type="date" required min={startDate} value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label></div><label>{t("guests")}<input type="number" min="1" max="20" value={guests} onChange={(event) => setGuests(Number(event.target.value))} /></label><label>{t("message")}<textarea maxLength={1200} value={message} onChange={(event) => setMessage(event.target.value)} /></label>{error && <p className="host-error">{error}</p>}<button type="submit" disabled={busy}>{busy ? t("sending") : t("sendRequest")}</button></form><small>{t("pendingNote")}</small></section></div>;
}
