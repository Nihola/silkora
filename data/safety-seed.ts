import { nearbyPlaces } from "@/data/nearby-places";
import { haversineKm } from "@/lib/geo";

export type SafetyPlace = { id: string; type: "hospital" | "pharmacy" | "police"; name: string; city: string; lat: number; lng: number; distanceKm: number };
const safetyPlaceSeed: Omit<SafetyPlace, "distanceKm">[] = [
  { id: "demo-hospital-tashkent", type: "hospital", name: "City hospital listing (demo)", city: "Tashkent", lat: 41.305, lng: 69.278 },
  { id: "demo-pharmacy-tashkent", type: "pharmacy", name: "Central pharmacy listing (demo)", city: "Tashkent", lat: 41.312, lng: 69.281 },
  { id: "demo-police-tashkent", type: "police", name: "Police station listing (demo)", city: "Tashkent", lat: 41.31, lng: 69.27 },
  { id: "demo-hospital-samarkand", type: "hospital", name: "City hospital listing (demo)", city: "Samarkand", lat: 39.65, lng: 66.97 },
  { id: "demo-pharmacy-samarkand", type: "pharmacy", name: "Central pharmacy listing (demo)", city: "Samarkand", lat: 39.655, lng: 66.98 },
  { id: "demo-police-samarkand", type: "police", name: "Police station listing (demo)", city: "Samarkand", lat: 39.66, lng: 66.975 },
  { id: "demo-hospital-bukhara", type: "hospital", name: "City hospital listing (demo)", city: "Bukhara", lat: 39.77, lng: 64.42 },
  { id: "demo-pharmacy-bukhara", type: "pharmacy", name: "Central pharmacy listing (demo)", city: "Bukhara", lat: 39.775, lng: 64.415 },
  { id: "demo-police-bukhara", type: "police", name: "Police station listing (demo)", city: "Bukhara", lat: 39.78, lng: 64.41 },
  { id: "demo-hospital-khiva", type: "hospital", name: "City hospital listing (demo)", city: "Khiva", lat: 41.38, lng: 60.36 },
  { id: "demo-pharmacy-khiva", type: "pharmacy", name: "Central pharmacy listing (demo)", city: "Khiva", lat: 41.378, lng: 60.362 },
  { id: "demo-police-khiva", type: "police", name: "Police station listing (demo)", city: "Khiva", lat: 41.377, lng: 60.355 },
];

export const emergencyNumbers = [
  { label: "emergencyServices", number: "112", note: "TODO_VERIFY" },
  { label: "ambulance", number: "103", note: "TODO_VERIFY" },
  { label: "police", number: "102", note: "TODO_VERIFY" },
  { label: "fireService", number: "101", note: "TODO_VERIFY" },
] as const;

export function nearestSafetyPlaces(city: string, point?: { lat: number; lng: number }) {
  const kinds = new Set(["hospital", "pharmacy", "police"]);
  const seeded = safetyPlaceSeed.map((place) => ({ ...place, distanceKm: point ? haversineKm(point, place) : 0 }));
  const dbFallback = nearbyPlaces.filter((place) => kinds.has(place.type) && place.city.toLowerCase() === city.toLowerCase()).map((place) => ({ ...place, distanceKm: point ? haversineKm(point, place) : 0 }));
  return [...dbFallback, ...seeded.filter((place) => place.city.toLowerCase() === city.toLowerCase())]
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export const safetyScamSeed = [
  { city: "Tashkent", title: "Agree taxi fares before the ride", description: "Check the app fare or agree on the price before setting off.", category: "transport", verified: false, demo: true },
  { city: "Samarkand", title: "Check the total before ordering", description: "Confirm menu prices and any service charge before ordering.", category: "restaurants", verified: false, demo: true },
  { city: "Bukhara", title: "Use official ticket counters", description: "Check admission prices at the official entrance before paying.", category: "tickets", verified: false, demo: true },
  { city: "Khiva", title: "Keep valuables secure in busy areas", description: "Keep your belongings close in crowded streets and markets.", category: "general", verified: false, demo: true },
  ...["Tashkent", "Samarkand", "Bukhara", "Khiva"].map((city) => ({ city, title: "Confirm a guide's agreed price", description: "Agree on the service and total cost before beginning.", category: "services", verified: false, demo: true })),
];
