import { getTranslations } from "next-intl/server";

export default async function Loading() {
  const t = await getTranslations("States");
  return <main className="section-placeholder" aria-busy="true"><p role="status" className="muted">{t("loading")}</p></main>;
}
