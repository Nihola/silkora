"use client";

import { useEffect, useRef } from "react";
import type { NearbyPlace } from "@/data/nearby-places";
import type { Map as LeafletMap, Marker } from "leaflet";

type Props = { places: NearbyPlace[]; center: [number, number]; onSelect: (id: string) => void; selectedId: string | null; mapLabel: string; mapCaption: string };

export function LeafletMapView({ places, center, onSelect, selectedId, mapLabel, mapCaption }: Props) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const markers = useRef<Marker[]>([]);
  const refresh = useRef<() => void>(() => undefined);
  const select = useRef(onSelect);
  const selected = useRef(selectedId);
  const list = useRef(places);
  select.current = onSelect;
  selected.current = selectedId;
  list.current = places;

  useEffect(() => {
    let active = true;
    let instance: LeafletMap | null = null;
    void import("leaflet").then((leaflet) => {
      if (!active || !element.current) return;
      const L = leaflet.default;
      instance = L.map(element.current, { zoomControl: false, scrollWheelZoom: false }).setView(center, 13);
      map.current = instance;
      L.control.zoom({ position: "bottomright" }).addTo(instance);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(instance);

      const renderMarkers = () => {
        if (!instance) return;
        markers.current.forEach((marker) => marker.remove());
        markers.current = [];
        const groups = new Map<string, NearbyPlace[]>();
        list.current.forEach((place) => {
          const pixel = instance!.latLngToContainerPoint([place.lat, place.lng]);
          const key = `${Math.floor(pixel.x / 48)}:${Math.floor(pixel.y / 48)}`;
          groups.set(key, [...(groups.get(key) ?? []), place]);
        });
        groups.forEach((group) => {
          const lat = group.reduce((sum, place) => sum + place.lat, 0) / group.length;
          const lng = group.reduce((sum, place) => sum + place.lng, 0) / group.length;
          const isCluster = group.length > 1;
          const activeMarker = group.some(({ id }) => id === selected.current);
          const icon = L.divIcon({
            className: `silkora-leaflet-marker${isCluster ? " cluster" : ""}${activeMarker ? " active" : ""}`,
            html: `<span>${isCluster ? group.length : ""}</span>`,
            iconSize: isCluster ? [38, 38] : [28, 36],
            iconAnchor: isCluster ? [19, 19] : [14, 32],
          });
          const marker = L.marker([lat, lng], { icon, keyboard: true }).addTo(instance!);
          marker.on("click", () => {
            if (isCluster && instance!.getZoom() < 16) instance!.setView([lat, lng], instance!.getZoom() + 2);
            else select.current(group[0].id);
          });
          markers.current.push(marker);
        });
      };
      refresh.current = renderMarkers;
      instance.on("zoomend moveend", renderMarkers);
      renderMarkers();
      const resizeObserver = new ResizeObserver(() => {
        if (element.current?.clientWidth && element.current.clientHeight) instance?.invalidateSize({ pan: false });
      });
      resizeObserver.observe(element.current);
      (instance as LeafletMap & { __silkoraResizeObserver?: ResizeObserver }).__silkoraResizeObserver = resizeObserver;
    });
    return () => {
      active = false;
      markers.current = [];
      (map.current as (LeafletMap & { __silkoraResizeObserver?: ResizeObserver }) | null)?.__silkoraResizeObserver?.disconnect();
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;
    map.current.setView(center, map.current.getZoom());
  }, [center]);

  useEffect(() => {
    refresh.current();
  }, [places, selectedId]);

  return <div className="leaflet-map-frame"><div className="leaflet-map" ref={element} aria-label={mapLabel} /><span className="leaflet-map-caption">{mapCaption}</span></div>;
}
