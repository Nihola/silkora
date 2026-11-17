"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, Check, Clock3, ExternalLink, MapPin, Phone, ShieldAlert, ShieldCheck } from "lucide-react";
import { emergencyNumbers, nearestSafetyPlaces, safetyScamSeed } from "@/data/safety-seed";
import { haversineKm } from "@/lib/geo";

type GeoPoint = { lat: number; lng: number };
type ApiResult = { error?: string; share?: { token: string; expiresAt: string }; link?: string; notified?: number; telegramUrl?: string | null; checkin?: { id: string; label: string; due_at: string; demo?: boolean }; report?: unknown };
type Checkin = { id: string; label: string; dueAt: string; done: boolean };
type LiveShare = { token: string; expiresAt: string };

function visitorId() {
  let id = localStorage.getItem("silkora-chat-user-id");
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("silkora-chat-user-id", id); }
  return id;
}

export function SafetyCenter() {
  const t = useTranslations("Safety");
  const [city, setCity] = useState("Tashkent");
  const [point, setPoint] = useState<GeoPoint | null>(null);
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [sharing, setSharing] = useState<LiveShare | null>(null);
  const [shareLink, setShareLink] = useState("");
  const [holding, setHolding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [scamAlerts, setScamAlerts] = useState<typeof safetyScamSeed>(safetyScamSeed);
  const [contact, setContact] = useState({ name: "", phone: "", relationship: "" });
  const [telegramUrl, setTelegramUrl] = useState("");
  const [checkinMinutes, setCheckinMinutes] = useState(60);
  const [checkinLabel, setCheckinLabel] = useState("");
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [report, setReport] = useState({ title: "", description: "", category: "general" });
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remindedCheckins = useRef(new Set<string>());
  const places = useMemo(() => {
    const nearby = nearestSafetyPlaces(city, point ?? undefined);
    return point ? nearby.map((place) => ({ ...place, distanceKm: haversineKm(point, place) })).sort((a, b) => a.distanceKm - b.distanceKm) : nearby;
  }, [city, point]);

  useEffect(() => {
    try {
      setUserId(visitorId());
      setCity(localStorage.getItem("silkora-city") ?? "Tashkent");
      setCheckins(JSON.parse(localStorage.getItem("silkora-safety-checkins") ?? "[]") as Checkin[]);
      const raw = localStorage.getItem("silkora-live-share");
      if (raw) { const saved = JSON.parse(raw) as { share: ApiResult["share"]; link: string }; if (saved.share && new Date(saved.share.expiresAt ?? 0).getTime() > Date.now()) { setSharing(saved.share); setShareLink(saved.link); } }
    } catch { /* Keep the seeded safety page available if browser storage is disabled. */ }
  }, []);

  useEffect(() => {
    let active = true;
    void fetch(`/api/safety?city=${encodeURIComponent(city)}`).then((response) => response.json()).then((data: { alerts?: typeof safetyScamSeed }) => { if (active && data.alerts?.length) setScamAlerts(data.alerts as typeof safetyScamSeed); }).catch(() => undefined);
    return () => { active = false; };
  }, [city]);

  useEffect(() => {
    const timer = setInterval(() => {
      const overdue = checkins.find((item) => !item.done && !remindedCheckins.current.has(item.id) && Date.parse(item.dueAt) <= Date.now());
      if (overdue) { remindedCheckins.current.add(overdue.id); setNotice(t("checkinOverdue", { label: overdue.label })); }
    }, 10_000);
    return () => clearInterval(timer);
  }, [checkins, t]);

  function locate(): Promise<GeoPoint> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error(t("locationUnavailable")));
      navigator.geolocation.getCurrentPosition((position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }), () => reject(new Error(t("locationDenied"))), { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 });
    });
  }

  async function post(body: Record<string, unknown>) {
    const response = await fetch("/api/safety", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, userId }) });
    const data = await response.json() as ApiResult;
    if (!response.ok) throw new Error(data.error || t("error"));
    return data;
  }

  async function startSos() {
    if (!consent || busy || !userId) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const location = await locate(); setPoint(location);
      const data = await post({ action: "start-share", name: name.trim() || t("traveler"), city, ...location });
      if (data.share && data.link) { setSharing(data.share); setShareLink(data.link); localStorage.setItem("silkora-live-share", JSON.stringify({ share: data.share, link: data.link })); setNotice(t("sosStarted", { count: data.notified ?? 0 })); }
    } catch (caught) { setError(caught instanceof Error ? caught.message : t("error")); }
    finally { setBusy(false); setHolding(false); }
  }

  function beginHold() {
    if (!consent) { setError(t("consentFirst")); return; }
    setHolding(true); holdTimer.current = setTimeout(() => void startSos(), 3000);
  }
  function cancelHold() { if (holdTimer.current) clearTimeout(holdTimer.current); setHolding(false); }

  useEffect(() => {
    if (!sharing || !userId || !navigator.geolocation) return;
    let alive = true;
    const timer = setInterval(() => navigator.geolocation.getCurrentPosition((position) => {
      if (!alive) return;
      const next = { lat: position.coords.latitude, lng: position.coords.longitude };
      setPoint(next);
      void fetch("/api/safety", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update-share", userId, token: sharing.token, ...next }) });
    }, () => undefined, { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }), 15_000);
    return () => { alive = false; clearInterval(timer); };
  }, [sharing, userId]);

  async function stop() {
    if (!sharing) return;
    setBusy(true);
    try { await post({ action: "stop-share", token: sharing.token }); setSharing(null); setShareLink(""); localStorage.removeItem("silkora-live-share"); setNotice(t("shareStopped")); }
    catch (caught) { setError(caught instanceof Error ? caught.message : t("error")); }
    finally { setBusy(false); }
  }

  async function addContact(event: React.FormEvent) {
    event.preventDefault(); setError("");
    try { const data = await post({ action: "create-contact", ...contact, notificationConsent: true }); if (data.telegramUrl) setTelegramUrl(data.telegramUrl); else setNotice(t("telegramSetupMissing")); setContact({ name: "", phone: "", relationship: "" }); }
    catch (caught) { setError(caught instanceof Error ? caught.message : t("error")); }
  }

  async function createCheckin(event: React.FormEvent) {
    event.preventDefault();
    try { const data = await post({ action: "checkin", label: checkinLabel || t("safeCheckin"), minutes: checkinMinutes }); if (data.checkin) { const item = { id: data.checkin.id, label: data.checkin.label, dueAt: data.checkin.due_at, done: false }; setCheckins((current) => { const next = [item, ...current]; localStorage.setItem("silkora-safety-checkins", JSON.stringify(next)); return next; }); setCheckinLabel(""); } }
    catch (caught) { setError(caught instanceof Error ? caught.message : t("error")); }
  }
  async function safeNow(id: string) { await post({ action: "safe-checkin", checkinId: id }); setCheckins((current) => { const next = current.map((item) => item.id === id ? { ...item, done: true } : item); localStorage.setItem("silkora-safety-checkins", JSON.stringify(next)); return next; }); }
  async function reportScam(event: React.FormEvent) { event.preventDefault(); try { await post({ action: "report-scam", city, ...report }); setNotice(t("reportQueued")); setReport({ title: "", description: "", category: "general" }); } catch (caught) { setError(caught instanceof Error ? caught.message : t("error")); } }

  return <main className="safety-page">
    <header className="safety-heading"><span className="safety-emblem"><ShieldCheck size={24} /></span><div><p className="card-overline">{t("eyebrow")}</p><h1>{t("title")}</h1><p>{t("subtitle")}</p></div></header>
    <p className="safety-consent-note"><ShieldCheck size={17} />{t("sharingNotice")}</p>
    {notice && <p className="safety-notice" role="status"><Check size={16} />{notice}</p>}{error && <p className="safety-error" role="alert"><AlertTriangle size={16} />{error}</p>}
    <section className="safety-card emergency-card"><div className="safety-section-title"><div><p className="card-overline">{t("urgent")}</p><h2>{t("emergencyNumbers")}</h2></div><Phone size={19} /></div><div className="emergency-grid">{emergencyNumbers.map((item) => <a href={`tel:${item.number}`} className="emergency-number" key={item.number}><span>{t(item.label)}</span><b>{item.number}</b><small>{t("todoVerify")}</small></a>)}</div>
      <div className="safety-location-row"><label>{t("city")}<select value={city} onChange={(event) => { setCity(event.target.value); localStorage.setItem("silkora-city", event.target.value); }}><option value="Tashkent">Tashkent</option><option value="Samarkand">Samarkand</option><option value="Bukhara">Bukhara</option><option value="Khiva">Khiva</option></select></label><button type="button" className="safety-secondary-button" onClick={() => void locate().then(setPoint).catch((caught) => setError(caught.message))}><MapPin size={15} />{t("findNearby")}</button></div>
      <div className="safety-nearby-grid">{["hospital", "pharmacy", "police"].map((type) => <div className="nearby-safety-list" key={type}><h3>{t(type)}</h3>{places.filter((place) => place.type === type).slice(0, 2).map((place) => <a href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`} target="_blank" rel="noreferrer" key={place.id}><span>{place.name}</span><small>{point ? `${(place.distanceKm * 1000).toFixed(0)} m` : t("seededPlace")}</small></a>)}{!places.some((place) => place.type === type) && <p>{t("noSeededPlace")}</p>}</div>)}</div>
    </section>

    <section className="safety-card sos-card"><div className="safety-section-title"><div><p className="card-overline">{t("shareTitle")}</p><h2>{t("sosTitle")}</h2></div><ShieldAlert size={21} /></div><p>{t("sosBody")}</p>
      {!sharing ? <><div className="safety-contact-fields"><label>{t("yourName")}<input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} placeholder={t("namePlaceholder")} /></label></div><label className="safety-checkbox"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>{t("explicitConsent")}</span></label><button className="sos-hold-button" type="button" disabled={busy} onPointerDown={beginHold} onPointerUp={cancelHold} onPointerLeave={cancelHold} onPointerCancel={cancelHold} onContextMenu={(event) => event.preventDefault()}>{busy ? t("gettingLocation") : holding ? t("holdNow") : t("holdThreeSeconds")}</button></> : <div className="safety-active-share"><b><i />{t("sharingLive")}</b><p>{t("expiresAt", { time: new Date(sharing.expiresAt).toLocaleTimeString() })}</p><a href={shareLink} target="_blank" rel="noreferrer">{t("openLiveLink")} <ExternalLink size={14} /></a><button type="button" disabled={busy} onClick={() => void stop()}>{t("stopSharing")}</button></div>}
      <small>{t("noEmergencySubstitute")}</small>
    </section>

    <section className="safety-card"><div className="safety-section-title"><div><p className="card-overline">{t("contactsEyebrow")}</p><h2>{t("linkContact")}</h2></div><Phone size={18} /></div><p>{t("contactIntro")}</p><form className="safety-form-grid" onSubmit={(event) => void addContact(event)}><label>{t("contactName")}<input required value={contact.name} onChange={(event) => setContact({ ...contact, name: event.target.value })} /></label><label>{t("contactPhone")}<input required type="tel" value={contact.phone} onChange={(event) => setContact({ ...contact, phone: event.target.value })} /></label><label>{t("relationship")}<input value={contact.relationship} onChange={(event) => setContact({ ...contact, relationship: event.target.value })} /></label><button type="submit">{t("createTelegramLink")}</button></form>{telegramUrl && <a className="telegram-link" href={telegramUrl} target="_blank" rel="noreferrer">{t("openTelegramStart")} <ExternalLink size={14} /></a>}</section>

    <section className="safety-card"><div className="safety-section-title"><div><p className="card-overline">{t("checkinEyebrow")}</p><h2>{t("checkinTitle")}</h2></div><Clock3 size={18} /></div><form className="safety-checkin-form" onSubmit={(event) => void createCheckin(event)}><input aria-label={t("checkinLabel")} value={checkinLabel} onChange={(event) => setCheckinLabel(event.target.value)} placeholder={t("checkinPlaceholder")} /><select value={checkinMinutes} onChange={(event) => setCheckinMinutes(Number(event.target.value))}><option value={30}>{t("minutes", { count: 30 })}</option><option value={60}>{t("hour", { count: 1 })}</option><option value={120}>{t("hours", { count: 2 })}</option><option value={240}>{t("hours", { count: 4 })}</option></select><button type="submit">{t("setTimer")}</button></form>{checkins.map((item) => <div className="safety-checkin-item" key={item.id}><div><b>{item.label}</b><small>{new Date(item.dueAt).toLocaleString()}</small></div>{item.done ? <span><Check size={14} />{t("checkedIn")}</span> : <button type="button" onClick={() => void safeNow(item.id)}>{t("imSafe")}</button>}</div>)}</section>

    <section className="safety-card"><div className="safety-section-title"><div><p className="card-overline">{t("localAlerts")}</p><h2>{t("scamTitle")}</h2></div><AlertTriangle size={19} /></div><p>{t("moderatedNotice")}</p><div className="safety-alert-list">{scamAlerts.filter((alert) => alert.city.toLowerCase() === city.toLowerCase()).map((alert, index) => <article key={`${alert.title}-${index}`}><span>{alert.verified ? t("verified") : t("generalTip")}</span><h3>{alert.title}</h3><p>{alert.description}</p></article>)}</div><details className="safety-report"><summary>{t("reportIncident")}</summary><form onSubmit={(event) => void reportScam(event)}><input required minLength={4} maxLength={120} value={report.title} onChange={(event) => setReport({ ...report, title: event.target.value })} placeholder={t("reportTitle")} /><textarea required minLength={10} maxLength={2000} value={report.description} onChange={(event) => setReport({ ...report, description: event.target.value })} placeholder={t("reportDescription")} /><button type="submit">{t("submitReport")}</button></form></details></section>
  </main>;
}
