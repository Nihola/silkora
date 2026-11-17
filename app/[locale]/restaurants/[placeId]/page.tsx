import { notFound } from "next/navigation";
import { RestaurantDetail } from "@/components/nearby/restaurant-detail";
import { nearbyPlaces } from "@/data/nearby-places";

export function generateStaticParams() {
  return nearbyPlaces.filter(({ type }) => type === "restaurant" || type === "cafe").map(({ id }) => ({ placeId: id }));
}

export default async function RestaurantPage({ params }: { params: Promise<{ placeId: string }> }) {
  const { placeId } = await params;
  const place = nearbyPlaces.find(({ id, type }) => id === placeId && (type === "restaurant" || type === "cafe"));
  if (!place) notFound();
  return <RestaurantDetail place={place} />;
}
