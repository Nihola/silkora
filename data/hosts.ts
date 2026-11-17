import type { HostNeed, MatchHost } from "@/lib/host-match";

export type HostProfile = MatchHost & {
  id: string;
  profileId: string;
  name: string;
  city: string;
  vibe: string;
  bio: string;
  photo: string;
  verified: boolean;
};

const ids = (host: number, profile: number) => ({ id: `40000000-0000-4000-8000-${String(host).padStart(12, "0")}`, profileId: `10000000-0000-4000-8000-${String(profile).padStart(12, "0")}` });
const accessibility = (needs: HostNeed[]): Partial<Record<HostNeed, boolean>> => Object.fromEntries(needs.map((need) => [need, true]));

export const hostSeed: HostProfile[] = [
  { ...ids(1, 20), name: "Dilnoza", city: "Tashkent", languages: ["Uzbek", "English"], interests: ["food", "architecture"], vibe: "Curious city walker", price: 18, rural: false, womenRun: true, accessibility: accessibility(["womenSafe", "halal", "family"]), bio: "Demo host profile for a neighborhood walk. Enjoys introducing guests to local food and architecture.", photo: "/images/places/food-courtyard.svg", verified: false },
  { ...ids(2, 21), name: "Aziz", city: "Tashkent", languages: ["Uzbek", "Russian", "English"], interests: ["markets", "crafts"], vibe: "Warm and practical", price: 15, rural: false, womenRun: false, accessibility: accessibility(["budget", "halal"]), bio: "Demo host profile for a market visit and local craft browsing.", photo: "/images/places/food-market.svg", verified: false },
  { ...ids(3, 22), name: "Malika", city: "Samarkand", languages: ["Uzbek", "English"], interests: ["history", "photography"], vibe: "History enthusiast", price: 22, rural: false, womenRun: true, accessibility: accessibility(["womenSafe", "family"]), bio: "Demo host profile for a heritage walk around Samarkand.", photo: "/images/places/attraction.svg", verified: false },
  { ...ids(4, 23), name: "Farhod", city: "Samarkand", languages: ["Uzbek", "Tajik", "English"], interests: ["food", "family"], vibe: "Relaxed local guide", price: 20, rural: false, womenRun: false, accessibility: accessibility(["halal", "family"]), bio: "Demo host profile for local food recommendations and family-friendly outings.", photo: "/images/places/food-uzbek.svg", verified: false },
  { ...ids(5, 24), name: "Zarina", city: "Bukhara", languages: ["Uzbek", "Russian", "English"], interests: ["crafts", "history"], vibe: "Old-town storyteller", price: 20, rural: false, womenRun: true, accessibility: accessibility(["womenSafe", "wheelchair", "halal"]), bio: "Demo host profile for a crafts and history walk through old Bukhara.", photo: "/images/places/attraction.svg", verified: false },
  { ...ids(6, 25), name: "Otabek", city: "Bukhara", languages: ["Uzbek", "English"], interests: ["tea", "architecture"], vibe: "Quiet courtyard host", price: 16, rural: false, womenRun: false, accessibility: accessibility(["budget", "family"]), bio: "Demo host profile for a quiet courtyard tea visit.", photo: "/images/places/food-courtyard.svg", verified: false },
  { ...ids(7, 26), name: "Nargiza", city: "Khiva", languages: ["Uzbek", "English"], interests: ["architecture", "photography"], vibe: "Early morning explorer", price: 18, rural: false, womenRun: true, accessibility: accessibility(["womenSafe", "family"]), bio: "Demo host profile for an early walk in the historic town.", photo: "/images/places/attraction.svg", verified: false },
  { ...ids(8, 27), name: "Bekzod", city: "Khiva", languages: ["Uzbek", "Karakalpak", "English"], interests: ["food", "crafts"], vibe: "Craft and food fan", price: 17, rural: false, womenRun: false, accessibility: accessibility(["halal", "budget"]), bio: "Demo host profile for local foods and craft introductions.", photo: "/images/places/food-market.svg", verified: false },
  { ...ids(9, 28), name: "Gulbahor", city: "Nurata", languages: ["Uzbek", "English"], interests: ["nature", "village-life"], vibe: "Rural guest host", price: 24, rural: true, womenRun: true, accessibility: accessibility(["womenSafe", "family", "halal"]), bio: "Demo rural host profile; travel arrangements and accessibility need confirmation.", photo: "/images/places/hotel.svg", verified: false },
  { ...ids(10, 29), name: "Sardor", city: "Tashkent", languages: ["Uzbek", "Russian", "English"], interests: ["museums", "coffee"], vibe: "Easygoing city local", price: 19, rural: false, womenRun: false, accessibility: accessibility(["wheelchair", "vegetarian", "family"]), bio: "Demo host profile for museums and cafes.", photo: "/images/places/food-courtyard.svg", verified: false },
];
