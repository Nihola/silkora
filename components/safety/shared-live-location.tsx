"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, MapPin, ShieldCheck } from "lucide-react";
import { LiveLocationMap } from "@/components/safety/live-location-map";

export function SharedLiveLocation({ token }: { token: string }) {
  const t = useTranslations("Safety");
  const [active, setActive] = useState<boolean | null>(null);
  const [updatedAt, setUpdatedAt] = useState("");
  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try { const response = await fetch(`/api/live/${token}`, { cache: "no-store" }); const data = await response.json() as { active?: boolean; updatedAt?: string }; if (alive) { setActive(response.ok && Boolean(data.active)); if (data.updatedAt) setUpdatedAt(data.updatedAt); } }
      catch { if (alive) setActive(false); }
    };
    void refresh(); const timer = setInterval(() => void refresh(), 15_000);
    return () => { alive = false; clearInterval(timer); };
  }, [token]);
  return <main className="safety-page safety-live-page"><header className="safety-heading"><span className="safety-emblem"><MapPin size={23} /></span><div><p className="card-overline">{t("liveEyebrow")}</p><h1>{t("liveTitle")}</h1><p>{t("liveSubtitle")}</p></div></header><p className="safety-consent-note"><ShieldCheck size={17} />{t("sharingNotice")}</p>{active ? <><LiveLocationMap token={token} label={t("liveTitle")} unavailable={t("mapLoading")} /><p className="live-update-time">{t("lastUpdated", { time: updatedAt ? new Date(updatedAt).toLocaleTimeString() : "—" })}</p></> : <section className="safety-card live-expired"><AlertTriangle size={24} /><h2>{t("shareUnavailable")}</h2><p>{t("shareExpired")}</p></section>}<p className="safety-disclaimer">{t("noEmergencySubstitute")}</p></main>;
}
