export type PackageStop = { name: string; lat: number; lng: number; x: number; y: number };
export type PackageDay = { title: string; description: string; stops: PackageStop[] };
export type TravelPackage = {
  id: string;
  title: string;
  cities: string[];
  days: number;
  priceUsd: number;
  style: "culture" | "adventure" | "food" | "family" | "budget" | "luxury";
  includes: string[];
  season: string[];
  rating: number;
  reviewCount: number;
  popularity: number;
  photo: string;
  description: string;
  agency: { name: string; city: string; bio: string; verified: boolean };
  itinerary: PackageDay[];
  reviews: { rating: number; text: string; traveler: string }[];
};

export const packageCities = ["Tashkent", "Samarkand", "Bukhara", "Khiva"] as const;
export const packageStyles = ["culture", "adventure", "food", "family", "budget", "luxury"] as const;
export const packageSeasons = ["spring", "summer", "autumn", "winter"] as const;

const demoReviews = [
  { rating: 5, text: "Demo review: clear information and a memorable stop.", traveler: "Demo Traveler One" },
  { rating: 4, text: "Demo review: a useful sample itinerary for planning.", traveler: "Demo Traveler Two" },
  { rating: 5, text: "Demo review: illustrative feedback, not from a real traveler.", traveler: "Demo Traveler Three" },
];
const demoAgency = { name: "Silk Road Demo Agency", city: "Tashkent", bio: "Illustrative agency profile. Details and availability need confirmation.", verified: false };

export const travelPackages: TravelPackage[] = [
  {
    id: "30000000-0000-4000-8000-000000000001", title: "Tashkent Flavors Walk", cities: ["Tashkent"], days: 1, priceUsd: 35, style: "food", includes: ["Market walk", "Local food tastings", "Guide"], season: ["spring", "summer", "autumn"], rating: 4.7, reviewCount: 3, popularity: 98, photo: "/images/packages/tashkent.svg", description: "A relaxed introduction to Tashkent through its market stalls, everyday food, and old-city tea stops.", agency: demoAgency,
    itinerary: [{ title: "Market morning & old city", description: "Meet near Chorsu, explore the market lanes, enjoy a traditional lunch, then pause for tea in the old city.", stops: [{ name: "Chorsu Bazaar", lat: 41.3268, lng: 69.2342, x: 26, y: 39 }, { name: "Old City", lat: 41.3204, lng: 69.2368, x: 54, y: 61 }, { name: "Amir Timur Square", lat: 41.3111, lng: 69.2797, x: 79, y: 35 }] }], reviews: demoReviews,
  },
  {
    id: "30000000-0000-4000-8000-000000000002", title: "Samarkand in a Day", cities: ["Samarkand"], days: 1, priceUsd: 49, style: "culture", includes: ["Local guide", "Walking route", "Entry planning"], season: ["spring", "autumn"], rating: 4.7, reviewCount: 3, popularity: 96, photo: "/images/packages/samarkand.svg", description: "Spend a day with Samarkand’s best-known architectural landmarks, with time to pause between the grand squares.", agency: demoAgency,
    itinerary: [{ title: "Timurid Samarkand", description: "Walk the Registan ensemble, continue to Gur-e-Amir, and finish with a relaxed sunset view.", stops: [{ name: "Registan Square", lat: 39.6548, lng: 66.9758, x: 27, y: 33 }, { name: "Gur-e-Amir", lat: 39.6486, lng: 66.9654, x: 51, y: 62 }, { name: "Bibi-Khanym Mosque", lat: 39.6601, lng: 66.9802, x: 78, y: 40 }] }], reviews: demoReviews,
  },
  {
    id: "30000000-0000-4000-8000-000000000003", title: "Bukhara Old Town Weekend", cities: ["Bukhara"], days: 2, priceUsd: 115, style: "culture", includes: ["Guided walking tour", "Breakfast", "Old-town route"], season: ["spring", "autumn", "winter"], rating: 4.7, reviewCount: 3, popularity: 94, photo: "/images/packages/bukhara.svg", description: "Two unhurried days among Bukhara’s trading domes, courtyards, and historic squares.", agency: demoAgency,
    itinerary: [
      { title: "Day 1 · Trading domes & Poi Kalyan", description: "Explore the covered bazaars and the landmark minaret and madrasa ensemble.", stops: [{ name: "Lyabi-Hauz", lat: 39.7744, lng: 64.4151, x: 25, y: 67 }, { name: "Trading Domes", lat: 39.7757, lng: 64.4164, x: 51, y: 48 }, { name: "Poi Kalyan", lat: 39.7767, lng: 64.4151, x: 78, y: 28 }] },
      { title: "Day 2 · Ark & old-town lanes", description: "Visit the historic citadel area, then follow the quieter lanes back through the old town.", stops: [{ name: "Ark of Bukhara", lat: 39.7806, lng: 64.4137, x: 26, y: 34 }, { name: "Old Town", lat: 39.7783, lng: 64.4172, x: 54, y: 56 }, { name: "Lyabi-Hauz", lat: 39.7744, lng: 64.4151, x: 78, y: 71 }] },
    ], reviews: [],
  },
  {
    id: "30000000-0000-4000-8000-000000000004", title: "Khiva Family Discovery", cities: ["Khiva"], days: 2, priceUsd: 135, style: "family", includes: ["Family-friendly route", "Local guide", "Flexible pace"], season: ["spring", "autumn"], rating: 4.7, reviewCount: 0, popularity: 88, photo: "/images/packages/khiva.svg", description: "A flexible two-day introduction to Khiva’s walled inner town, with short walks and time to rest.", agency: demoAgency,
    itinerary: [
      { title: "Day 1 · Itchan Kala", description: "Get oriented inside the walls and explore the main lanes and courtyards at an easy pace.", stops: [{ name: "West Gate", lat: 41.3785, lng: 60.3591, x: 23, y: 55 }, { name: "Kalta Minor", lat: 41.3787, lng: 60.3605, x: 51, y: 30 }, { name: "Kunya-Ark", lat: 41.3788, lng: 60.3618, x: 77, y: 56 }] },
      { title: "Day 2 · Palaces & craft lanes", description: "Visit palace courtyards and browse the old town’s craft workshops.", stops: [{ name: "Tash Khauli Palace", lat: 41.3775, lng: 60.3621, x: 29, y: 35 }, { name: "Juma Mosque", lat: 41.3782, lng: 60.3609, x: 54, y: 62 }, { name: "East Gate", lat: 41.3789, lng: 60.363, x: 78, y: 39 }] },
    ], reviews: [],
  },
  {
    id: "30000000-0000-4000-8000-000000000005", title: "Four Cities on a Budget", cities: ["Tashkent", "Samarkand", "Bukhara", "Khiva"], days: 4, priceUsd: 249, style: "budget", includes: ["Rail planning", "Walking routes", "Budget travel notes"], season: ["spring", "autumn"], rating: 4.5, reviewCount: 0, popularity: 82, photo: "/images/packages/silk-road.svg", description: "A fast, budget-minded route through Uzbekistan’s four signature cities, with independent time built in.", agency: demoAgency,
    itinerary: [
      { title: "Day 1 · Tashkent", description: "Arrive, get oriented, and visit a neighborhood market.", stops: [{ name: "Chorsu Bazaar", lat: 41.3268, lng: 69.2342, x: 30, y: 38 }, { name: "Amir Timur Square", lat: 41.3111, lng: 69.2797, x: 73, y: 60 }] },
      { title: "Day 2 · Samarkand", description: "Use a self-guided walking route through the historic center.", stops: [{ name: "Registan Square", lat: 39.6548, lng: 66.9758, x: 31, y: 40 }, { name: "Gur-e-Amir", lat: 39.6486, lng: 66.9654, x: 70, y: 61 }] },
      { title: "Day 3 · Bukhara", description: "Follow the old-town lane between the central landmarks.", stops: [{ name: "Poi Kalyan", lat: 39.7767, lng: 64.4151, x: 32, y: 37 }, { name: "Lyabi-Hauz", lat: 39.7744, lng: 64.4151, x: 69, y: 63 }] },
      { title: "Day 4 · Khiva", description: "Explore the walled inner town before departure.", stops: [{ name: "Kalta Minor", lat: 41.3787, lng: 60.3605, x: 34, y: 40 }, { name: "Tash Khauli", lat: 41.3775, lng: 60.3621, x: 69, y: 61 }] },
    ], reviews: [],
  },
  {
    id: "30000000-0000-4000-8000-000000000006", title: "Silk Road Heritage Loop", cities: ["Tashkent", "Samarkand", "Bukhara", "Khiva"], days: 7, priceUsd: 690, style: "culture", includes: ["City guides", "Rail planning", "Heritage stops"], season: ["spring", "autumn"], rating: 4.7, reviewCount: 3, popularity: 99, photo: "/images/packages/silk-road.svg", description: "A week-long overview connecting the four cities with a mix of guided highlights and independent exploring.", agency: demoAgency,
    itinerary: [
      { title: "Day 1 · Tashkent arrival", description: "Settle in and explore a central neighborhood.", stops: [{ name: "Amir Timur Square", lat: 41.3111, lng: 69.2797, x: 30, y: 55 }, { name: "Chorsu Bazaar", lat: 41.3268, lng: 69.2342, x: 72, y: 36 }] },
      { title: "Day 2 · Samarkand", description: "Spend a full day around the Registan, mausoleums, and local lanes.", stops: [{ name: "Registan Square", lat: 39.6548, lng: 66.9758, x: 28, y: 35 }, { name: "Shah-i-Zinda", lat: 39.6627, lng: 66.9882, x: 72, y: 61 }] },
      { title: "Day 3 · Samarkand at your pace", description: "Leave time for a museum, craft workshop, or a slow cafe stop.", stops: [{ name: "Gur-e-Amir", lat: 39.6486, lng: 66.9654, x: 29, y: 60 }, { name: "Registan Square", lat: 39.6548, lng: 66.9758, x: 72, y: 39 }] },
      { title: "Day 4 · Bukhara", description: "Arrive in Bukhara and walk through the trading domes.", stops: [{ name: "Trading Domes", lat: 39.7757, lng: 64.4164, x: 29, y: 36 }, { name: "Poi Kalyan", lat: 39.7767, lng: 64.4151, x: 71, y: 61 }] },
      { title: "Day 5 · Bukhara old town", description: "Explore the Ark, courtyards, and quiet old-town streets.", stops: [{ name: "Ark of Bukhara", lat: 39.7806, lng: 64.4137, x: 28, y: 62 }, { name: "Lyabi-Hauz", lat: 39.7744, lng: 64.4151, x: 72, y: 39 }] },
      { title: "Day 6 · Khiva", description: "Arrive and take an evening walk inside the old city walls.", stops: [{ name: "West Gate", lat: 41.3785, lng: 60.3591, x: 29, y: 57 }, { name: "Kalta Minor", lat: 41.3787, lng: 60.3605, x: 71, y: 37 }] },
      { title: "Day 7 · Khiva farewell", description: "Visit the palace courtyards and finish with time for local crafts.", stops: [{ name: "Kunya-Ark", lat: 41.3788, lng: 60.3618, x: 30, y: 37 }, { name: "Tash Khauli", lat: 41.3775, lng: 60.3621, x: 70, y: 61 }] },
    ], reviews: demoReviews,
  },
  {
    id: "30000000-0000-4000-8000-000000000007", title: "Desert & Ancient Fortresses", cities: ["Khiva", "Bukhara"], days: 3, priceUsd: 380, style: "adventure", includes: ["Route planning", "Fortress stops", "Countryside day"], season: ["spring", "autumn"], rating: 4.6, reviewCount: 0, popularity: 80, photo: "/images/packages/silk-road.svg", description: "A sample route pairing Khiva’s old town with a countryside day near ancient desert fortresses.", agency: demoAgency,
    itinerary: [
      { title: "Day 1 · Khiva walls", description: "Explore the old town and plan for the countryside route.", stops: [{ name: "Itchan Kala", lat: 41.3785, lng: 60.3598, x: 28, y: 41 }, { name: "Kunya-Ark", lat: 41.3788, lng: 60.3618, x: 72, y: 60 }] },
      { title: "Day 2 · Desert fortresses", description: "A countryside excursion; confirm transport, access, and conditions before travel.", stops: [{ name: "Khorezm countryside", lat: 41.5, lng: 60.4, x: 32, y: 60 }, { name: "Fortress route", lat: 41.6, lng: 60.5, x: 70, y: 37 }] },
      { title: "Day 3 · Bukhara", description: "Finish with a walk through Bukhara’s central historic quarter.", stops: [{ name: "Poi Kalyan", lat: 39.7767, lng: 64.4151, x: 30, y: 37 }, { name: "Lyabi-Hauz", lat: 39.7744, lng: 64.4151, x: 70, y: 62 }] },
    ], reviews: [],
  },
  {
    id: "30000000-0000-4000-8000-000000000008", title: "Private Silk Road Collection", cities: ["Tashkent", "Samarkand", "Bukhara"], days: 5, priceUsd: 1450, style: "luxury", includes: ["Private car (demo)", "Curated stays (demo)", "Guide"], season: ["spring", "summer", "autumn"], rating: 4.9, reviewCount: 0, popularity: 78, photo: "/images/packages/silk-road.svg", description: "A premium-style sample itinerary with private transfers and curated stays. All services and prices are illustrative only.", agency: demoAgency,
    itinerary: [
      { title: "Day 1 · Tashkent welcome", description: "A private-style city orientation and an easy first evening.", stops: [{ name: "Amir Timur Square", lat: 41.3111, lng: 69.2797, x: 28, y: 39 }, { name: "Tashkent old city", lat: 41.3204, lng: 69.2368, x: 72, y: 62 }] },
      { title: "Day 2 · Samarkand icons", description: "A guided day around the landmark ensemble and mausoleum quarter.", stops: [{ name: "Registan Square", lat: 39.6548, lng: 66.9758, x: 29, y: 38 }, { name: "Gur-e-Amir", lat: 39.6486, lng: 66.9654, x: 72, y: 62 }] },
      { title: "Day 3 · Samarkand by design", description: "Flexible time for craft traditions, gardens, and a long lunch.", stops: [{ name: "Shah-i-Zinda", lat: 39.6627, lng: 66.9882, x: 28, y: 58 }, { name: "Registan Square", lat: 39.6548, lng: 66.9758, x: 72, y: 39 }] },
      { title: "Day 4 · Bukhara arrival", description: "Walk the trading domes and settle into the old-town rhythm.", stops: [{ name: "Poi Kalyan", lat: 39.7767, lng: 64.4151, x: 29, y: 38 }, { name: "Lyabi-Hauz", lat: 39.7744, lng: 64.4151, x: 72, y: 61 }] },
      { title: "Day 5 · Bukhara farewell", description: "A relaxed final morning and a curated farewell stop.", stops: [{ name: "Ark of Bukhara", lat: 39.7806, lng: 64.4137, x: 28, y: 61 }, { name: "Old Town", lat: 39.7753, lng: 64.4177, x: 72, y: 38 }] },
    ], reviews: [],
  },
];
