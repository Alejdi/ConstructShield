"use client";

import "leaflet/dist/leaflet.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";
import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";

// Fix Leaflet default marker icons (broken by bundlers)
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export interface MapMarkerData {
  id: string;
  position: [number, number];
  label?: string;
}

export interface MapViewProps {
  center: [number, number];
  zoom?: number;
  markers?: MapMarkerData[];
  className?: string;
  interactive?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  onMarkerClick?: (id: string) => void;
  selectedMarkerId?: string | null;
}

/** Forces Leaflet to recalculate tile positions after the container mounts / resizes. */
function InvalidateSize() {
  const map = useMap();

  useEffect(() => {
    // Small delay lets the dynamic-import wrapper finish layout
    const timer = setTimeout(() => map.invalidateSize(), 100);
    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

function FitBounds({ markers }: { markers: MapMarkerData[] }) {
  const map = useMap();

  useEffect(() => {
    if (markers.length === 0) return;
    if (markers.length === 1) {
      map.setView(markers[0].position, 14);
      return;
    }
    const bounds = L.latLngBounds(markers.map((m) => m.position));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [markers, map]);

  return null;
}

function MapClickHandler({
  onClick,
}: {
  onClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function MapView({
  center,
  zoom = 13,
  markers = [],
  className = "h-48",
  interactive = true,
  onMapClick,
  onMarkerClick,
  selectedMarkerId,
}: MapViewProps) {
  const stableMarkers = useMemo(() => markers, [JSON.stringify(markers)]);

  return (
    <div className={`relative overflow-hidden rounded-md border ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={interactive}
        dragging={interactive}
        doubleClickZoom={interactive}
        zoomControl={interactive}
        touchZoom={interactive}
        style={{ width: "100%", height: "100%", zIndex: 0 }}
      >
        <InvalidateSize />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {stableMarkers.length > 0 && <FitBounds markers={stableMarkers} />}
        {onMapClick && <MapClickHandler onClick={onMapClick} />}
        <MarkerClusterGroup chunkedLoading maxClusterRadius={50}>
          {stableMarkers.map((marker) => (
            <Marker
              key={marker.id}
              position={marker.position}
              eventHandlers={
                onMarkerClick
                  ? { click: () => onMarkerClick(marker.id) }
                  : undefined
              }
              opacity={
                selectedMarkerId && selectedMarkerId !== marker.id ? 0.5 : 1
              }
            >
              {marker.label && <Popup>{marker.label}</Popup>}
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
