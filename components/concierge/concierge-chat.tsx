"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Banknote, Bot, CalendarDays, Check, Compass, MapPin, Send, ShieldAlert, Sparkles, Star, Sun, X } from "lucide-react";

type ToolResult = { toolName: string; output: unknown };
type ChatMessage = { id: string; role: "user" | "assistant"; content: string; toolResults?: ToolResult[] };
type SosConfirmation = { token: string; reason: string };
type ResponseBody = { answer?: string; error?: string; toolResults?: ToolResult[]; mode?: string };
type RecordValue = Record<string, unknown>;

function asRecord(value: unknown): RecordValue | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : null;
}
function asItems(output: unknown): RecordValue[] {
  const items = asRecord(output)?.items;
  return Array.isArray(items) ? items.map(asRecord).filter((item): item is RecordValue => item !== null) : [];
}
function str(value: unknown, fallback = ""): string { return typeof value === "string" ? value : fallback; }
function num(value: unknown): number | null { return typeof value === "number" && Number.isFinite(value) ? value : null; }
function makeVisitorId() { return crypto.randomUUID?.() ?? "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (token) => { const random = Math.floor(Math.random() * 16); return (token === "x" ? random : (random & 3) | 8).toString(16); }); }
function placeHref(item: RecordValue) {
  const id = str(item.id);
  return str(item.type) === "restaurant" || str(item.type) === "cafe" ? `/restaurants/${id}` : `/places/${id}`;
}

export function ConciergeChat() {
  const t = useTranslations("Concierge");
  const locale = useLocale();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [city, setCity] = useState("Tashkent");
  const [userId, setUserId] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sosConfirmation, setSosConfirmation] = useState<SosConfirmation | null>(null);
  const [confirmingSos, setConfirmingSos] = useState(false);
  const [toast, setToast] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const displayCity = t(`cities.${city.toLowerCase()}`);

  useEffect(() => {
    try {
      const savedCity = localStorage.getItem("silkora-city");
      if (savedCity) setCity({ tashkent: "Tashkent", samarkand: "Samarkand", bukhara: "Bukhara", khiva: "Khiva" }[savedCity] ?? "Tashkent");
      let savedId = localStorage.getItem("silkora-chat-user-id");
      if (!savedId) { savedId = makeVisitorId(); localStorage.setItem("silkora-chat-user-id", savedId); }
      setUserId(savedId);
    } catch { setUserId(makeVisitorId()); }
  }, []);
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }); }, [messages, sending]);

  function persistToolAction(result: ToolResult) {
    const output = asRecord(result.output);
    if (!output) return;
    if (result.toolName === "add_to_trip" && output.action === "add_to_trip") {
      const item = asRecord(output.item);
      if (!item) return;
      try {
        const entries = JSON.parse(localStorage.getItem("silkora-trip-items") ?? "[]") as RecordValue[];
        const entry = { id: str(item.id), title: str(item.title), kind: str(item.kind, "idea"), city: str(item.city, "Tashkent"), photo: str(item.photo) || undefined, day: num(item.day) ?? 1, priceUsd: num(item.priceUsd) ?? undefined, lat: num(item.lat) ?? undefined, lng: num(item.lng) ?? undefined };
        if (entry.id && !entries.some((existing) => existing.id === entry.id)) localStorage.setItem("silkora-trip-items", JSON.stringify([...entries, entry]));
        setToast(t("addedToTrip"));
      } catch { setToast(t("addedToTrip")); }
    }
    if (result.toolName === "create_booking_request" && output.action === "create_booking_request") {
      const request = asRecord(output.bookingRequest);
      if (!request) return;
      try {
        const entries = JSON.parse(localStorage.getItem("silkora-booking-requests") ?? "[]") as RecordValue[];
        if (!entries.some((entry) => entry.id === request.id)) localStorage.setItem("silkora-booking-requests", JSON.stringify([...entries, request]));
        setToast(t("bookingSaved"));
      } catch { setToast(t("bookingSaved")); }
    }
    if (result.toolName === "trigger_sos" && output.action === "sos_confirmation_required") {
      setSosConfirmation({ token: str(output.confirmationToken), reason: str(output.reason) });
    }
  }

  async function sendMessage(content: string) {
    const trimmed = content.trim();
    if (!trimmed || sending || !userId) return;
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: trimmed };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages); setInput(""); setSending(true); setError(""); setToast("");
    try {
      const response = await fetch("/api/concierge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, locale, city, messages: nextMessages.slice(-16).map(({ role, content: messageContent }) => ({ role, content: messageContent })) }) });
      const body = await response.json() as ResponseBody;
      if (!response.ok) throw new Error(body.error || t("friendlyError"));
      const results = body.toolResults ?? [];
      results.forEach(persistToolAction);
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: body.answer || t("friendlyFallback"), toolResults: results }]);
    } catch (caught) {
      setError(caught instanceof Error && caught.message ? caught.message : t("friendlyError"));
    } finally { setSending(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); await sendMessage(input); }

  async function confirmSos() {
    if (!sosConfirmation || confirmingSos) return;
    setConfirmingSos(true);
    try {
      const response = await fetch("/api/concierge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, locale, city, confirmSosToken: sosConfirmation.token }) });
      const body = await response.json() as ResponseBody;
      if (!response.ok) throw new Error(body.error || t("friendlyError"));
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: body.answer || t("sosDemoRecorded"), toolResults: body.toolResults ?? [] }]);
      setSosConfirmation(null);
    } catch (caught) { setError(caught instanceof Error ? caught.message : t("friendlyError")); setSosConfirmation(null); }
    finally { setConfirmingSos(false); }
  }

  return <main className="concierge-page">
    <header className="concierge-header"><span className="concierge-avatar"><Bot size={22} /></span><div><p className="card-overline">{t("eyebrow")}</p><h1>{t("title")}</h1><p>{t("subtitle", { city: displayCity })}</p></div><span className="concierge-status"><i />{t("ready")}</span></header>
    {toast && <p className="concierge-toast" role="status"><Check size={14} />{toast}<span>{t("demoTag")}</span></p>}
    <div className="concierge-messages" ref={listRef} aria-live="polite">
      {!messages.length && <section className="concierge-welcome"><span><Sparkles size={21} /></span><h2>{t("welcomeTitle")}</h2><p>{t("welcomeBody")}</p><div className="concierge-suggestions">{(["suggestPlaces", "suggestPackages", "suggestPrice", "suggestSafety", "suggestWeather"] as const).map((key, index) => { const Icon = [Compass, CalendarDays, Banknote, ShieldAlert, Sun][index]; const label = key === "suggestPlaces" ? t(key, { city: displayCity }) : t(key); return <button type="button" key={key} disabled={sending || !userId} onClick={() => void sendMessage(label)}><Icon size={14} />{label}</button>; })}</div></section>}
      {messages.map((message) => <article className={`concierge-message ${message.role}`} key={message.id}><span className="chat-message-avatar">{message.role === "assistant" ? <Bot size={16} /> : <span>Y</span>}</span><div className="chat-message-content"><p>{message.content}</p>{message.toolResults?.map((result, index) => <ToolResultCard key={`${result.toolName}-${index}`} result={result} t={t} onConfirmSos={setSosConfirmation} />)}</div></article>)}
      {sending && <div className="concierge-message assistant"><span className="chat-message-avatar"><Bot size={16} /></span><p className="concierge-thinking">{t("thinking")}</p></div>}
      {error && <p className="concierge-error" role="alert">{error}</p>}
    </div>
    <form className="concierge-composer" onSubmit={submit}><textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder={t("inputPlaceholder")} rows={2} maxLength={1200} disabled={sending || !userId} /><button type="submit" aria-label={t("sendMessage")} disabled={sending || !input.trim() || !userId}><Send size={17} /></button><small>{t("groundedNote")}</small></form>
    {sosConfirmation && <div className="concierge-confirm-backdrop" role="presentation"><section className="concierge-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="sos-confirm-title"><button type="button" className="concierge-confirm-close" onClick={() => setSosConfirmation(null)} aria-label={t("closeConfirmation")}><X size={17} /></button><span className="concierge-sos-icon"><ShieldAlert size={23} /></span><p className="card-overline">{t("sosDemo")}</p><h2 id="sos-confirm-title">{t("sosConfirmTitle")}</h2><p>{t("sosConfirmBody")}</p><small>{sosConfirmation.reason}</small><div><button type="button" onClick={() => setSosConfirmation(null)}>{t("cancel")}</button><button type="button" disabled={confirmingSos} onClick={() => void confirmSos()}>{confirmingSos ? t("sending") : t("confirmDemoSos")}</button></div></section></div>}
  </main>;
}

function ToolResultCard({ result, t, onConfirmSos }: { result: ToolResult; t: ReturnType<typeof useTranslations>; onConfirmSos: (confirmation: SosConfirmation) => void }) {
  const output = asRecord(result.output);
  if (!output) return null;
  const sourceLabel = output.source === "database" ? "DB" : t("demoTag");
  if (result.toolName === "search_places") return <section className="concierge-result-card"><div className="concierge-result-heading"><MapPin size={15} /><strong>{t("placesFound")}</strong><span>{sourceLabel}</span></div>{asItems(output).map((place) => <Link className="concierge-place-result" href={placeHref(place)} key={str(place.id)}><span style={{ backgroundImage: `url(${str(place.photo, "/images/places/attraction.svg")})` }} /><div><strong>{str(place.name)}</strong><small>{t(`cities.${str(place.city).toLowerCase()}`, { defaultValue: str(place.city) })} · {str(place.cuisine, str(place.type))}{typeof place.rating === "number" ? ` · ★ ${place.rating.toFixed(1)}` : ""}</small></div><ArrowRight size={14} /></Link>)}</section>;
  if (result.toolName === "search_packages") return <section className="concierge-result-card"><div className="concierge-result-heading"><Compass size={15} /><strong>{t("packagesFound")}</strong><span>{sourceLabel}</span></div>{asItems(output).map((pack) => <Link className="concierge-package-result" href={`/packages/${str(pack.id)}`} key={str(pack.id)}><span style={{ backgroundImage: `url(${str(pack.photo, "/images/packages/silk-road.svg")})` }} /><div><strong>{str(pack.title)}</strong><small>{Array.isArray(pack.cities) ? pack.cities.map((name) => t(`cities.${String(name).toLowerCase()}`, { defaultValue: String(name) })).join(", ") : t("cities.multiple")} · {num(pack.days) ?? "—"} {t("days")} · ${num(pack.priceUsd) ?? "—"}</small></div><ArrowRight size={14} /></Link>)}</section>;
  if (result.toolName === "get_fair_price") return <section className="concierge-result-card"><div className="concierge-result-heading"><Star size={15} /><strong>{t("fairPriceTitle")}</strong><span>{sourceLabel}</span></div>{asItems(output).map((price, index) => <div className="concierge-price-result" key={`${str(price.item)}-${index}`}><div><strong>{str(price.item)}</strong><small>{t(`cities.${str(price.city).toLowerCase()}`, { defaultValue: str(price.city) })} · {str(price.unit)}</small></div><b>{num(price.fairMin)?.toLocaleString() ?? "—"}–{num(price.fairMax)?.toLocaleString() ?? "—"} {str(price.currency, "UZS")}</b></div>)}</section>;
  if (result.toolName === "get_scam_alerts") return <section className="concierge-result-card safety"><div className="concierge-result-heading"><ShieldAlert size={15} /><strong>{t("safetyReminders")}</strong><span>{sourceLabel}</span></div>{asItems(output).map((alert, index) => <article className="concierge-alert-result" key={`${str(alert.title)}-${index}`}><strong>{str(alert.title)}</strong><p>{str(alert.description)}</p><small>{t(`cities.${str(alert.city).toLowerCase()}`, { defaultValue: str(alert.city) })} · {t("generalReminder")}</small></article>)}</section>;
  if (result.toolName === "get_weather") return <section className="concierge-weather-result"><Sun size={21} /><div><strong>{str(output.city)}</strong><small>{str(output.source)}</small></div><b>{num(output.temperatureC) ?? "—"}°C</b><span>{output.demo ? t("sampleWeather") : t("liveWeather")}</span></section>;
  if (result.toolName === "add_to_trip") return <section className="concierge-action-result"><Check size={16} /><div><strong>{t("addedToTrip")}</strong><small>{str(asRecord(output.item)?.title)} · {t("demoTag")}</small></div><Link href="/trips">{t("viewTrip")} <ArrowRight size={13} /></Link></section>;
  if (result.toolName === "create_booking_request") { const request = asRecord(output.bookingRequest); return <section className="concierge-action-result booking"><CalendarDays size={16} /><div><strong>{t("bookingSaved")}</strong><small>{str(request?.targetTitle)} · {str(request?.status)} · {t("demoTag")}</small></div><Link href="/trips">{t("viewTrip")} <ArrowRight size={13} /></Link></section>; }
  if (result.toolName === "find_hosts") return <section className="concierge-action-result"><MapPin size={16} /><div><strong>{t("hostsStub")}</strong><small>{t("hostsStubBody")}</small></div></section>;
  if (result.toolName === "trigger_sos" && output.action === "sos_confirmation_required") return <section className="concierge-action-result sos-pending"><ShieldAlert size={17} /><div><strong>{t("sosPending")}</strong><small>{t("demoNoContact")}</small></div><button type="button" onClick={() => onConfirmSos({ token: str(output.confirmationToken), reason: str(output.reason) })}>{t("reviewAndConfirm")}</button></section>;
  if (result.toolName === "trigger_sos" && output.action === "sos_demo_recorded") return <section className="concierge-action-result"><Check size={16} /><div><strong>{t("sosDemoRecorded")}</strong><small>{t("demoNoContact")}</small></div></section>;
  return null;
}
