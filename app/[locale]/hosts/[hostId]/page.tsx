import { HostBrowser } from "@/components/hosts/host-browser";

export default async function HostProfilePage({ params }: { params: Promise<{ hostId: string }> }) {
  const { hostId } = await params;
  return <HostBrowser hostId={hostId} />;
}
