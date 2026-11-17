export type GeoPoint = { lat: number; lng: number };

/** Great-circle distance in kilometers between two latitude/longitude points. */
export function haversineKm(from: GeoPoint, to: GeoPoint): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(to.lat - from.lat);
  const longitudeDelta = radians(to.lng - from.lng);
  const arc = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(from.lat)) * Math.cos(radians(to.lat)) * Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc));
}

/** Rating and review activity rank a place, while a five-kilometer scale gently lowers distant results. */
export function popularityScore(rating: number, reviewCount: number, distanceKm: number): number {
  const distancePenalty = 1 / (1 + Math.max(0, distanceKm) / 5);
  return Math.max(0, rating) * Math.log(Math.max(0, reviewCount) + 1) * distancePenalty;
}
