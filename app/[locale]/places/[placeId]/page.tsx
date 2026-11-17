import { notFound } from "next/navigation";
import { PlaceDetail } from "@/components/explore/place-detail";
import { RestaurantDetail } from "@/components/nearby/restaurant-detail";
import { nearbyPlaces } from "@/data/nearby-places";

export function generateStaticParams() {
  return nearbyPlaces.map(({ id }) => ({ placeId: id }));
}

export default async function PlacePage({ params }: { params: Promise<{ placeId: string }> }) {
  const { placeId } = await params;
  const place = nearbyPlaces.find(({ id }) => id === placeId);
  if (!place) notFound();
  if (place.type === "restaurant" || place.type === "cafe") return <RestaurantDetail place={place} />;
  return <PlaceDetail place={place} />;
}
