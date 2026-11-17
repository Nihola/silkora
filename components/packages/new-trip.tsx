"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Check, Compass, Plus } from "lucide-react";

export function NewTripStart() {
  const t = useTranslations("Packages");
  const tripT = useTranslations("Trip");
  const [created, setCreated] = useState(false);

  useEffect(() => {
    try { setCreated(localStorage.getItem("silkora-blank-trip-created") === "true"); } catch { /* Start with an empty trip prompt. */ }
  }, []);

  function createTrip() {
    const trip = { id: globalThis.crypto?.randomUUID?.() ?? `trip-${Date.now()}`, title: t("newTripTitle"), items: [], createdAt: new Date().toISOString(), demo: true };
    try {
      const drafts = JSON.parse(localStorage.getItem("silkora-trip-drafts") ?? "[]") as { id: string }[];
      if (!drafts.some((draft) => draft.id === trip.id)) localStorage.setItem("silkora-trip-drafts", JSON.stringify([...drafts, trip]));
      localStorage.setItem("silkora-blank-trip-created", "true");
    } catch { /* The blank trip can still be started for this session. */ }
    setCreated(true);
  }

  return <main className="new-trip-page"><Link href="/packages" className="package-back-link"><ArrowLeft size={16} />{t("backToPackages")}</Link><div className="new-trip-art"><span>✳</span><Compass size={39} /><i>✦</i></div><p className="card-overline">{tripT("eyebrow")}</p><h1>{t("newTripTitle")}</h1><p className="new-trip-description">{t("newTripBody")}</p>{created ? <div className="new-trip-success"><span><Check size={18} /></span><p>{t("newTripCreated")}</p></div> : <button className="package-book-button new-trip-create" type="button" onClick={createTrip}><Plus size={17} />{t("newTripAction")} <ArrowRight size={16} /></button>}<Link className="new-trip-back" href="/packages">{t("backToPackages")}</Link></main>;
}
