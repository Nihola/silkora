export const cityOptions = [
  { key: "tashkent", name: "Tashkent", lat: 41.3111, lng: 69.2797 },
  { key: "samarkand", name: "Samarkand", lat: 39.6548, lng: 66.9758 },
  { key: "bukhara", name: "Bukhara", lat: 39.7747, lng: 64.4151 },
  { key: "khiva", name: "Khiva", lat: 41.3785, lng: 60.3598 },
] as const;

export const nearbySeed = [
  { name: "Amir Timur Square", city: "Tashkent", kind: "Attraction", lat: 41.3111, lng: 69.2797, detail: "Open-air landmark · central Tashkent" },
  { name: "Chorsu Bazaar", city: "Tashkent", kind: "Market", lat: 41.3268, lng: 69.2342, detail: "Local market · food and crafts" },
  { name: "Anor Garden Cafe", city: "Tashkent", kind: "Cafe", lat: 41.2995, lng: 69.2401, detail: "Cafe · vegetarian options" },
  { name: "Registan Square", city: "Samarkand", kind: "Attraction", lat: 39.6548, lng: 66.9758, detail: "Historic ensemble · city center" },
  { name: "Shah-i-Zinda", city: "Samarkand", kind: "Attraction", lat: 39.6627, lng: 66.9882, detail: "Historic mausoleums · northeast old town" },
  { name: "Silk & Spice Cafe", city: "Samarkand", kind: "Cafe", lat: 39.6552, lng: 66.9682, detail: "Cafe · courtyard seating" },
  { name: "Poi Kalyan Complex", city: "Bukhara", kind: "Attraction", lat: 39.7767, lng: 64.4151, detail: "Historic ensemble · old town" },
  { name: "Lyabi-Hauz Ensemble", city: "Bukhara", kind: "Attraction", lat: 39.7744, lng: 64.4151, detail: "Historic square · old town" },
  { name: "Old Town Coffee", city: "Bukhara", kind: "Cafe", lat: 39.7762, lng: 64.419, detail: "Cafe · breakfast and coffee" },
  { name: "Itchan Kala", city: "Khiva", kind: "Attraction", lat: 41.3785, lng: 60.3598, detail: "Walled inner town · historic center" },
  { name: "Kunya-Ark Citadel", city: "Khiva", kind: "Attraction", lat: 41.3788, lng: 60.3618, detail: "Citadel · inside Itchan Kala" },
  { name: "Kalta Minor Tea Room", city: "Khiva", kind: "Cafe", lat: 41.3787, lng: 60.3605, detail: "Tea room · old town" },
] as const;

export const packageSeed = [
  { id: "30000000-0000-4000-8000-000000000001", title: "Tashkent Flavors Walk", city: "tashkent", days: 1, price: 35, style: "food", mark: "01", color: "mint" },
  { id: "30000000-0000-4000-8000-000000000002", title: "Samarkand in a Day", city: "samarkand", days: 1, price: 49, style: "culture", mark: "02", color: "gold" },
  { id: "30000000-0000-4000-8000-000000000003", title: "Bukhara Old Town Weekend", city: "bukhara", days: 2, price: 115, style: "culture", mark: "03", color: "blue" },
  { id: "30000000-0000-4000-8000-000000000006", title: "Silk Road Heritage Loop", city: "multiple", days: 7, price: 690, style: "culture", mark: "04", color: "rose" },
] as const;

export const arrivalItems = ["sim", "cash", "payments", "taxi", "registration"] as const;

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const radians = (degree: number) => (degree * Math.PI) / 180;
  const latitudeDelta = radians(b.lat - a.lat);
  const longitudeDelta = radians(b.lng - a.lng);
  const arc = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc));
}
