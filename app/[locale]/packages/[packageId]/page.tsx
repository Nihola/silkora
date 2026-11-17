import { notFound } from "next/navigation";
import { PackageDetail } from "@/components/packages/package-detail";
import { travelPackages } from "@/data/packages";

export function generateStaticParams() {
  return travelPackages.map(({ id }) => ({ packageId: id }));
}

export default async function PackageDetailPage({ params }: { params: Promise<{ packageId: string }> }) {
  const { packageId } = await params;
  const item = travelPackages.find((candidate) => candidate.id === packageId);
  if (!item) notFound();
  return <PackageDetail item={item} />;
}
