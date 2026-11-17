"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Props = { token: string; label: string; unavailable: string };
type LeafletApi = Pick<typeof import("leaflet"), "map" | "tileLayer" | "marker">;
export function LiveLocationMap({ token, label, unavailable }: Props) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const lastPoint = useRef<[number, number] | null>(null);

  useEffect(() => {
    let active = true;
    let realtime: SupabaseClient | null = null;
    let realtimeReady = false;
    let leaflet: LeafletApi | null = null;
    async function render(lat: number, lng: number) {
      lastPoint.current = [lat, lng];
      if (!leaflet && active) leaflet = (await import("leaflet")).default as LeafletApi;
      if (!active || !element.current || !leaflet) return;
      if (!map.current) {
        map.current = leaflet.map(element.current, { zoomControl: true }).setView([lat, lng], 15);
        leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map.current);
        marker.current = leaflet.marker([lat, lng]).addTo(map.current).bindPopup(label).openPopup();
      } else {
        marker.current?.setLatLng([lat, lng]);
        map.current.panTo([lat, lng]);
      }
    }
    const read = async () => {
      try {
        const response = await fetch(`/api/live/${token}`, { cache: "no-store" });
        const data = await response.json() as { lat?: number; lng?: number; active?: boolean };
        if (response.ok && data.active && typeof data.lat === "number" && typeof data.lng === "number") void render(data.lat, data.lng);
      } catch { /* Realtime subscription remains active if REST is offline. */ }
    };
    const interval = setInterval(() => { if (!realtimeReady) void read(); }, 15_000);
    void read();
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (baseUrl && anon) {
      realtime = createClient(baseUrl, anon);
      realtime.channel(`live-share:${token}`, { config: { private: true } }).on("broadcast", { event: "location" }, ({ payload }) => {
        const row = payload as { lat?: number; lng?: number; stopped_at?: string | null };
        if (row.stopped_at) return;
        if (typeof row.lat === "number" && typeof row.lng === "number") void render(row.lat, row.lng);
      }).subscribe((status) => { realtimeReady = status === "SUBSCRIBED"; });
    }
    return () => { active = false; clearInterval(interval); if (realtime) void realtime.removeAllChannels(); map.current?.remove(); map.current = null; };
  }, [token, label]);

  return <div className="safety-live-map" ref={element} aria-label={label}><span className="sr-only">{unavailable}</span></div>;
}
