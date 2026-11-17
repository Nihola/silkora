import { notFound } from "next/navigation";
import { CityLanding } from "@/components/explore/city-landing";
import { cityOptions } from "@/data/home-seed";

export function generateStaticParams() {
  return cityOptions.map(({ key }) => ({ slug: key }));
}

export default async function CityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!cityOptions.some(({ key }) => key === slug)) notFound();
  return <CityLanding slug={slug} />;
}
