export type HostNeed = "wheelchair" | "womenSafe" | "halal" | "vegetarian" | "family" | "budget";
export type MatchTraveler = { languages: string[]; interests: string[]; maxPrice: number; needs: HostNeed[]; preferRural?: boolean; preferWomenRun?: boolean };
export type MatchHost = { languages: string[]; interests: string[]; price: number; rural: boolean; womenRun: boolean; accessibility?: Partial<Record<HostNeed, boolean>> };
export type MatchReason = { key: "language" | "interest" | "price" | "needs" | "preference"; text: string };
export type MatchResult = { score: number; reasons: MatchReason[] };

const clean = (values: string[]) => new Set(values.map((value) => value.trim().toLocaleLowerCase()).filter(Boolean));

/** Deterministic host-fit score. Scores include fit evidence, not safety or service guarantees. */
export function scoreMatch(traveler: MatchTraveler, host: MatchHost): MatchResult {
  let score = 0;
  const reasons: MatchReason[] = [];
  const languages = [...clean(traveler.languages)].filter((language) => clean(host.languages).has(language));
  if (!traveler.languages.length) score += 25;
  else if (languages.length) { score += Math.round(25 * languages.length / clean(traveler.languages).size); reasons.push({ key: "language", text: `Shared language${languages.length > 1 ? "s" : ""}: ${languages.join(", ")}` }); }

  const interests = [...clean(traveler.interests)].filter((interest) => clean(host.interests).has(interest));
  if (!traveler.interests.length) score += 35;
  else if (interests.length) { score += Math.round(35 * interests.length / clean(traveler.interests).size); reasons.push({ key: "interest", text: `Shared interests: ${interests.join(", ")}` }); }

  if (traveler.maxPrice <= 0 || host.price <= traveler.maxPrice) {
    score += 20;
    reasons.push({ key: "price", text: traveler.maxPrice <= 0 ? `Listed at $${host.price}` : `Within your $${traveler.maxPrice} budget ($${host.price})` });
  } else if (traveler.maxPrice > 0) {
    const fit = Math.max(0, 1 - (host.price - traveler.maxPrice) / Math.max(traveler.maxPrice, 1));
    score += Math.round(20 * fit);
  }

  if (!traveler.needs.length) score += 15;
  else {
    const covered = traveler.needs.filter((need) => host.accessibility?.[need] === true);
    score += Math.round(15 * covered.length / traveler.needs.length);
    if (covered.length) reasons.push({ key: "needs", text: `Host lists support for: ${covered.map((need) => need === "womenSafe" ? "women travelers" : need).join(", ")}` });
  }

  const preferences: string[] = [];
  if (traveler.preferRural && host.rural) preferences.push("rural setting");
  if (traveler.preferWomenRun && host.womenRun) preferences.push("women-run host");
  score += preferences.length * 2.5;
  if (preferences.length) reasons.push({ key: "preference", text: `Matches your preference: ${preferences.join(", ")}` });
  if (!reasons.length) reasons.push({ key: "interest", text: "A local host option to explore" });
  return { score: Math.max(0, Math.min(100, Math.round(score))), reasons };
}
