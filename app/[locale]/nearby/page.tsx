import { NearbyExplorer } from "@/components/nearby/nearby-explorer";
import type { NearbyCategory } from "@/data/nearby-places";

const categoryAliases: Record<string, NearbyCategory> = {
  restaurant: "restaurant", restaurants: "restaurant", cafe: "cafe", cafes: "cafe", atm: "atm", atms: "atm",
  pharmacy: "pharmacy", pharmacies: "pharmacy", hotel: "hotel", hotels: "hotel", attraction: "attraction", attractions: "attraction",
};

export default async function NearbyPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  return <NearbyExplorer initialCategory={category ? categoryAliases[category] ?? "restaurant" : "restaurant"} />;
}
