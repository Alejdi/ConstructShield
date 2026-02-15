"use client";

import { MapView } from "@/components/map";
import type { MapMarkerData } from "@/components/map";

interface StaticLocationMapProps {
  latitude: number;
  longitude: number;
  label?: string;
  className?: string;
}

export function StaticLocationMap({
  latitude,
  longitude,
  label,
  className = "h-48",
}: StaticLocationMapProps) {
  const markers: MapMarkerData[] = [
    {
      id: "location",
      position: [latitude, longitude],
      label,
    },
  ];

  return (
    <MapView
      center={[latitude, longitude]}
      zoom={14}
      markers={markers}
      className={className}
      interactive={false}
    />
  );
}
