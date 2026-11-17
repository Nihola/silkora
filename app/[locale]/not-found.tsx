import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Compass } from "lucide-react";

export default async function NotFound() {
  const t = await getTranslations("States");
  return <main className="section-placeholder"><div className="placeholder-mark"><Compass size={27} /></div><h1>{t("notFoundTitle")}</h1><p className="muted">{t("notFoundBody")}</p><Link href="/" className="back-link">{t("home")}</Link></main>;
}
