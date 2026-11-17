"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { Bot, Compass, HeartHandshake, Home, Languages, Map, MoreHorizontal, ShieldAlert, ShoppingBag, Wrench } from "lucide-react";

const tabs = [
  { href: "/", key: "home", Icon: Home }, { href: "/explore", key: "explore", Icon: Compass },
  { href: "/trips", key: "trips", Icon: Map }, { href: "/concierge", key: "concierge", Icon: Bot },
  { href: "/more", key: "more", Icon: MoreHorizontal },
] as const;
const moreItems = [
  { href: "/toolkit", key: "toolkit", Icon: Wrench }, { href: "/safety", key: "safety", Icon: ShieldAlert },
  { href: "/community", key: "community", Icon: HeartHandshake }, { href: "/market", key: "market", Icon: ShoppingBag },
  { href: "/hosts", key: "hosts", Icon: Home },
] as const;

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const t = useTranslations("Navigation");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isMore = pathname.endsWith("/more");

  function changeLocale(nextLocale: string) {
    const segments = pathname.split("/");
    segments[1] = nextLocale;
    startTransition(() => router.replace(segments.join("/") || `/${nextLocale}`));
  }

  return <div className="app-frame">
    <header className="topbar"><Link href="/" className="brand" aria-label="Silkora home"><span className="brand-mark">✳</span>Silkora</Link>
      <div className="top-actions"><label className="language-select"><Languages size={15} /><span className="sr-only">{t("language")}</span><select aria-label={t("language")} value={locale} disabled={pending} onChange={(event) => changeLocale(event.target.value)}><option value="en">EN</option><option value="ru">RU</option><option value="uz">UZ</option></select></label><Link className="sos-shortcut" href="/safety"><span className="sos-dot" />SOS</Link></div>
    </header>
    {children}
    {isMore && <div className="more-panel">{moreItems.map(({ href, key, Icon }) => <Link className="more-item" href={href} key={key}><span className="more-icon"><Icon size={19} /></span><span>{t(key)}</span><span className="more-arrow">›</span></Link>)}</div>}
    <nav className="bottom-tabs" aria-label={t("mainNavigation")}>{tabs.map(({ href, key, Icon }) => {
      const active = key === "home" ? pathname.endsWith("/") : key === "more" ? isMore || moreItems.some(({ href: itemHref }) => pathname.endsWith(itemHref)) : pathname.endsWith(href) || pathname.includes(`${href}/`);
      return <Link className={`tab-link${active ? " is-active" : ""}`} href={href} key={key} aria-current={active ? "page" : undefined}><Icon size={20} strokeWidth={active ? 2.4 : 1.8} /><span>{t(key)}</span></Link>;
    })}</nav>
  </div>;
}
