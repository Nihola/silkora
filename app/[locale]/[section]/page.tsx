import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, Compass } from "lucide-react";

const sectionKeys = ["explore", "trips", "more", "toolkit", "safety", "community", "market"] as const;
export function generateStaticParams() { return sectionKeys.map((section) => ({ section })); }

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const t = await getTranslations("Sections");
  if (!sectionKeys.includes(section as (typeof sectionKeys)[number])) notFound();
  return <main className="section-placeholder"><Link href="/" className="back-link"><ArrowLeft size={17} /> {t("back")}</Link><div className="placeholder-mark"><Compass size={27} /></div><p className="eyebrow">{t("eyebrow")}</p><h1>{t(section as (typeof sectionKeys)[number])}</h1><p className="muted">{t("body")}</p><span className="demo-badge">{t("demo")}</span></main>;
}
