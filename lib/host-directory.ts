import { hostSeed, type HostProfile } from "@/data/hosts";

export async function getHosts(): Promise<HostProfile[]> {
  const baseUrl = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !key) return hostSeed;
  try {
    const url = new URL("/rest/v1/hosts", baseUrl);
    url.searchParams.set("select", "id,profile_id,city,languages,interests,vibe,price,rural,women_run,bio,photo,verified,accessibility,experience_types,profiles(display_name)");
    const response = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store", signal: AbortSignal.timeout(3500) });
    if (!response.ok) return hostSeed;
    const rows: unknown = await response.json();
    if (!Array.isArray(rows) || !rows.length) return hostSeed;
    return rows.map((value) => {
      const row = value as Record<string, unknown>;
      const profile = Array.isArray(row.profiles) ? row.profiles[0] as Record<string, unknown> | undefined : row.profiles as Record<string, unknown> | null;
      return { id: String(row.id), profileId: String(row.profile_id), name: typeof profile?.display_name === "string" ? profile.display_name : String(row.vibe ?? "Local host"), city: String(row.city), languages: Array.isArray(row.languages) ? row.languages.map(String) : [], interests: Array.isArray(row.interests) ? row.interests.map(String) : [], vibe: String(row.vibe ?? ""), price: Number(row.price ?? 0), rural: row.rural === true, womenRun: row.women_run === true, accessibility: row.accessibility && typeof row.accessibility === "object" ? row.accessibility as HostProfile["accessibility"] : {}, bio: String(row.bio ?? ""), photo: typeof row.photo === "string" ? row.photo : "/images/places/attraction.svg", verified: row.verified === true } satisfies HostProfile;
    });
  } catch { return hostSeed; }
}
