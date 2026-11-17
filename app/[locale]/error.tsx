"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { TriangleAlert } from "lucide-react";

export default function LocaleError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("States");
  return <main className="section-placeholder" role="alert"><div className="placeholder-mark"><TriangleAlert size={27} /></div><h1>{t("errorTitle")}</h1><p className="muted">{t("errorBody")}</p>
    <p><button type="button" className="tab-link" onClick={reset}>{t("retry")}</button> <Link href="/" className="back-link">{t("home")}</Link></p></main>;
}
