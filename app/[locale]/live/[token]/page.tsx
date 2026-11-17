import { SharedLiveLocation } from "@/components/safety/shared-live-location";

export default async function LivePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <SharedLiveLocation token={token} />;
}
