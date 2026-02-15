"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Navigation, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { MapView } from "@/components/map";
import type { MapMarkerData } from "@/components/map";

interface LocationPickerProps {
  latFieldName?: string;
  lngFieldName?: string;
  addressFieldName?: string;
  showAddressField?: boolean;
  required?: boolean;
  initialLatitude?: number | null;
  initialLongitude?: number | null;
  initialAddress?: string;
}

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  address: string;
  resolved: boolean;
}

export function LocationPicker({
  latFieldName = "latitude",
  lngFieldName = "longitude",
  addressFieldName = "address",
  showAddressField = false,
  required = false,
  initialLatitude,
  initialLongitude,
  initialAddress,
}: LocationPickerProps) {
  const hasInitial = initialLatitude != null && initialLongitude != null;
  const t = useTranslations();
  const [location, setLocation] = useState<LocationState>({
    latitude: hasInitial ? initialLatitude : null,
    longitude: hasInitial ? initialLongitude : null,
    address: initialAddress ?? "",
    resolved: hasInitial,
  });
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [manualAddress, setManualAddress] = useState(initialAddress ?? "");

  async function handleUseMyLocation() {
    if (!navigator.geolocation) {
      toast.error(t("location.notSupported"));
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Reverse geocode to get address
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16`,
            { headers: { "User-Agent": "ConstructShield/1.0" } }
          );
          const data = await res.json();
          const address = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

          setLocation({ latitude, longitude, address, resolved: true });
          setManualAddress(address);
        } catch {
          setLocation({
            latitude,
            longitude,
            address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            resolved: true,
          });
        }

        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error(t("location.denied"));
        } else {
          toast.error(t("location.unavailable"));
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleGeocodeAddress() {
    if (!manualAddress.trim()) return;
    setIsGeocoding(true);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualAddress)}&limit=1`,
        { headers: { "User-Agent": "ConstructShield/1.0" } }
      );
      const data = await res.json();

      if (data.length === 0) {
        toast.error(t("location.addressNotFound"));
        setIsGeocoding(false);
        return;
      }

      const { lat, lon, display_name } = data[0];
      setLocation({
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        address: display_name,
        resolved: true,
      });
      setManualAddress(display_name);
    } catch {
      toast.error(t("location.geocodeFailed"));
    }

    setIsGeocoding(false);
  }

  async function handleMapClick(lat: number, lng: number) {
    setLocation({
      latitude: lat,
      longitude: lng,
      address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      resolved: true,
    });

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`,
        { headers: { "User-Agent": "ConstructShield/1.0" } }
      );
      const data = await res.json();
      const address = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setLocation({ latitude: lat, longitude: lng, address, resolved: true });
      setManualAddress(address);
    } catch {
      // Keep coordinate-based address
    }
  }

  const mapMarkers: MapMarkerData[] =
    location.resolved && location.latitude !== null && location.longitude !== null
      ? [{ id: "selected", position: [location.latitude, location.longitude] }]
      : [];

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {t("location.title")}
      </p>

      {/* Use My Location Button */}
      <Button
        type="button"
        variant="outline"
        onClick={handleUseMyLocation}
        disabled={isLocating}
        className="w-full justify-start gap-2"
      >
        {isLocating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Navigation className="h-4 w-4" />
        )}
        {isLocating ? t("location.gettingLocation") : t("location.useMyLocation")}
      </Button>

      {/* Manual Address Input */}
      <div className="flex gap-2">
        <Input
          value={manualAddress}
          onChange={(e) => {
            setManualAddress(e.target.value);
            if (location.resolved) {
              setLocation((prev) => ({ ...prev, resolved: false }));
            }
          }}
          placeholder={t("location.addressPlaceholder")}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleGeocodeAddress}
          disabled={isGeocoding || !manualAddress.trim()}
          size="icon"
        >
          {isGeocoding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MapPin className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Mini Map */}
      {location.resolved && location.latitude !== null && location.longitude !== null && (
        <MapView
          center={[location.latitude, location.longitude]}
          zoom={14}
          markers={mapMarkers}
          className="h-48"
          onMapClick={handleMapClick}
        />
      )}

      {/* Resolved Location Confirmation */}
      {location.resolved && location.latitude !== null && (
        <div className="flex items-start gap-2 border border-trust-green/20 bg-trust-green/5 p-3">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-trust-green" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-trust-green">
              {t("location.locationSet")}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {location.address}
            </p>
          </div>
        </div>
      )}

      {/* Required validation */}
      {required && !location.resolved && (
        <p className="text-xs text-danger-red">
          {t("location.required")}
        </p>
      )}

      {/* Hidden form fields */}
      <input type="hidden" name={latFieldName} value={location.latitude ?? ""} />
      <input type="hidden" name={lngFieldName} value={location.longitude ?? ""} />
      {showAddressField && (
        <input type="hidden" name={addressFieldName} value={location.address} />
      )}
      {required && (
        <input
          type="text"
          required
          value={location.resolved ? "set" : ""}
          onChange={() => {}}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
