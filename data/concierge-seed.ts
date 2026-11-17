export const fairPriceSeed = [
  { item: "Shared city taxi ride", city: "Tashkent", fairMin: 5000, fairMax: 15000, currency: "UZS", unit: "per passenger" },
  { item: "Tea at a local chaikhana", city: "Tashkent", fairMin: 8000, fairMax: 20000, currency: "UZS", unit: "per pot" },
  { item: "Fresh non bread", city: "Tashkent", fairMin: 4000, fairMax: 10000, currency: "UZS", unit: "each" },
  { item: "Simple plov lunch", city: "Tashkent", fairMin: 25000, fairMax: 55000, currency: "UZS", unit: "per meal" },
  { item: "Metro ride", city: "Tashkent", fairMin: 1700, fairMax: 3000, currency: "UZS", unit: "per ride" },
  { item: "Fresh non bread", city: "Samarkand", fairMin: 4000, fairMax: 12000, currency: "UZS", unit: "each" },
  { item: "Simple plov lunch", city: "Samarkand", fairMin: 25000, fairMax: 60000, currency: "UZS", unit: "per meal" },
  { item: "Shared city taxi ride", city: "Bukhara", fairMin: 5000, fairMax: 15000, currency: "UZS", unit: "per passenger" },
  { item: "Local lunch", city: "Bukhara", fairMin: 25000, fairMax: 60000, currency: "UZS", unit: "per meal" },
  { item: "Khorezm noodle lunch", city: "Khiva", fairMin: 25000, fairMax: 65000, currency: "UZS", unit: "per meal" },
  { item: "Bottled water", city: "Khiva", fairMin: 3000, fairMax: 8000, currency: "UZS", unit: "per bottle" },
];

export const scamAlertSeed = [
  { city: "Tashkent", title: "Agree taxi fare before departure", description: "Use a clearly priced ride or agree the fare before starting. This is a general reminder, not a report about a named driver.", category: "transport", verified: false, demo: true },
  { city: "Tashkent", title: "Compare market prices", description: "Check a few stalls and confirm the total before paying.", category: "shopping", verified: false, demo: true },
  { city: "Samarkand", title: "Confirm guide inclusions in writing", description: "Confirm duration, entry costs, and meeting point before a tour.", category: "tours", verified: false, demo: true },
  { city: "Samarkand", title: "Use official ticket counters", description: "Check current ticket rules at the venue before buying from a third party.", category: "tickets", verified: false, demo: true },
  { city: "Bukhara", title: "Agree souvenir prices first", description: "Confirm the full price and currency before a purchase.", category: "shopping", verified: false, demo: true },
  { city: "Bukhara", title: "Check the taxi route", description: "Confirm the destination and expected fare before the ride begins.", category: "transport", verified: false, demo: true },
  { city: "Khiva", title: "Check what an entry ticket includes", description: "Ask which sites and dates are covered before purchasing a pass.", category: "tickets", verified: false, demo: true },
  { city: "Khiva", title: "Confirm craft prices", description: "Ask for the price before a demonstration or custom order begins.", category: "shopping", verified: false, demo: true },
];

export const cityWeatherSeed: Record<string, { temperatureC: number; condition: string }> = {
  Tashkent: { temperatureC: 24, condition: "Partly cloudy" },
  Samarkand: { temperatureC: 22, condition: "Partly cloudy" },
  Bukhara: { temperatureC: 26, condition: "Clear" },
  Khiva: { temperatureC: 25, condition: "Clear" },
};
