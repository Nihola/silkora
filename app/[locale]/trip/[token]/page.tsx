import { notFound } from "next/navigation";
import { SharedTrip, type SharedTripData } from "@/components/packages/shared-trip";

export default async function SharedTripPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try {
    const decoded = Buffer.from(token.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const parsed = JSON.parse(decoded) as Partial<SharedTripData>;
    if (typeof parsed.title !== "string" || typeof parsed.days !== "number" || !Array.isArray(parsed.items) || parsed.days < 1 || parsed.days > 14) notFound();
    const items = parsed.items.filter((item): item is SharedTripData["items"][number] => Boolean(item && typeof item.id === "string" && typeof item.title === "string" && typeof item.day === "number" && typeof item.city === "string"));
    return <SharedTrip trip={{ title: parsed.title, days: parsed.days, items }} />;
  } catch { notFound(); }
}
