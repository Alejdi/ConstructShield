"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, MapPin, ArrowRight, Navigation, Star } from "lucide-react";
import Link from "next/link";
import {
  SUBSCRIPTION_TIER_LABELS,
  SEARCH_RADIUS_OPTIONS,
  SERVICE_CATEGORIES,
} from "@/lib/constants";
import { formatDistance, getTravelFeeLabel, cn } from "@/lib/utils";
import type { SubscriptionTier } from "@/lib/types/database";
import {
  searchNearbyContractors,
  type NearbyContractor,
} from "@/actions/contractors";
import { MarketplaceFilterBar } from "@/components/marketplace/marketplace-filter-bar";
import type { FilterFieldConfig } from "@/lib/types/filters";
import { useTranslations } from "next-intl";
import { MapWithList } from "@/components/map/map-with-list";
import type { MapMarkerData } from "@/components/map";

type ContractorListing = {
  id: string;
  business_name: string;
  verified: boolean;
  subscription_tier: SubscriptionTier;
  specialties: string[] | null;
  service_area: string | null;
  bio: string | null;
  reputation_score: number;
  profiles: { full_name: string; avatar_url: string | null };
};

interface ContractorDirectoryProps {
  initialContractors: ContractorListing[];
  filters?: {
    q?: string;
    specialty?: string;
    verified?: string;
    sort?: string;
  };
}

export function ContractorDirectory({
  initialContractors,
  filters,
}: ContractorDirectoryProps) {
  const t = useTranslations("contractors");

  const filterFields: FilterFieldConfig[] = [
    {
      param: "q",
      label: t("searchByName"),
      type: "search",
      placeholder: t("searchByName"),
    },
    {
      param: "specialty",
      label: t("specialty"),
      type: "select",
      options: SERVICE_CATEGORIES.map((c) => ({
        label: c.label,
        value: c.value,
      })),
    },
    {
      param: "verified",
      label: t("verifiedOnly"),
      type: "toggle",
    },
    {
      param: "sort",
      label: t("sortBy"),
      type: "sort",
      options: [
        { label: t("verifiedFirst"), value: "verified" },
        { label: t("topRated"), value: "reputation" },
        { label: t("newest"), value: "newest" },
      ],
    },
  ];

  const [nearbyContractors, setNearbyContractors] = useState<
    NearbyContractor[] | null
  >(null);
  const [selectedRadius, setSelectedRadius] = useState(50000);
  const [isLocating, setIsLocating] = useState(false);
  const [userCoords, setUserCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: false, timeout: 5000 }
    );
  }, []);

  useEffect(() => {
    if (!userCoords || selectedRadius === 0) {
      setNearbyContractors(null);
      return;
    }

    searchNearbyContractors(userCoords.lat, userCoords.lng, selectedRadius)
      .then(setNearbyContractors)
      .catch(() => setNearbyContractors(null));
  }, [userCoords, selectedRadius]);

  // Apply client-side filters on nearby results
  const filteredNearby = useMemo(() => {
    if (!nearbyContractors) return null;
    let result = [...nearbyContractors];

    if (filters?.q) {
      const lower = filters.q.toLowerCase();
      result = result.filter((c) =>
        c.business_name.toLowerCase().includes(lower)
      );
    }
    if (filters?.verified === "true") {
      result = result.filter((c) => c.verified);
    }
    if (filters?.specialty) {
      result = result.filter((c) =>
        c.specialties?.includes(filters.specialty!)
      );
    }
    return result;
  }, [nearbyContractors, filters]);

  // Use nearby data if available, otherwise fall back to initial data
  const showNearby = filteredNearby !== null && selectedRadius !== 0;
  const [selectedContractorId, setSelectedContractorId] = useState<string | null>(null);

  const contractorMarkers: MapMarkerData[] = useMemo(() => {
    if (!filteredNearby) return [];
    return filteredNearby
      .filter((c) => c.latitude != null && c.longitude != null)
      .map((c) => ({
        id: c.id,
        position: [c.latitude!, c.longitude!] as [number, number],
        label: c.business_name,
      }));
  }, [filteredNearby]);

  const handleMarkerClick = useCallback((id: string) => {
    setSelectedContractorId(id);
    const el = document.querySelector(`[data-contractor-id="${id}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  return (
    <>
      {/* Filter Bar */}
      <MarketplaceFilterBar fields={filterFields} />

      {/* Radius Filter */}
      {userCoords && (
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Navigation className="h-3 w-3" />
            <span className="font-medium uppercase tracking-[0.1em]">
              {t("searchRadius")}
            </span>
          </div>
          {SEARCH_RADIUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedRadius(option.value)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-xs font-medium uppercase tracking-[0.1em] transition-colors",
                selectedRadius === option.value
                  ? "border-foreground bg-foreground text-background"
                  : "text-muted-foreground hover:border-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {isLocating && (
        <p className="mb-6 text-xs text-muted-foreground">
          {t("gettingLocation")}
        </p>
      )}

      <p className="mb-4 text-xs text-muted-foreground">
        {showNearby
          ? t("nearbyCount", { count: filteredNearby.length })
          : t("foundCount", { count: initialContractors.length })}
      </p>

      {showNearby && filteredNearby.length === 0 ? (
        <div className="border-t py-20 text-center">
          <p className="text-muted-foreground">
            {t("noContractorsNearby", { distance: formatDistance(selectedRadius) })}
          </p>
          <button
            onClick={() => setSelectedRadius(0)}
            className="mt-3 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground underline transition-colors hover:text-foreground"
          >
            {t("showAll")}
          </button>
        </div>
      ) : showNearby ? (
        contractorMarkers.length > 0 && userCoords ? (
          <MapWithList
            markers={contractorMarkers}
            center={[userCoords.lat, userCoords.lng]}
            onMarkerClick={handleMarkerClick}
            selectedId={selectedContractorId}
          >
            <div className="space-y-2">
              {filteredNearby.map((contractor) => (
                <NearbyContractorCard
                  key={contractor.id}
                  contractor={contractor}
                  selected={selectedContractorId === contractor.id}
                />
              ))}
            </div>
          </MapWithList>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredNearby.map((contractor) => (
              <NearbyContractorCard key={contractor.id} contractor={contractor} />
            ))}
          </div>
        )
      ) : initialContractors.length === 0 ? (
        <div className="border-t py-20 text-center">
          <p className="text-muted-foreground">
            {t("noContractorsYet")}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {initialContractors.map((contractor) => (
            <div key={contractor.id} className="flex flex-col border p-6">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="font-bold">
                    {contractor.business_name || t("unnamedBusiness")}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {contractor.profiles?.full_name}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {contractor.verified && (
                    <Badge className="bg-trust-green/10 text-trust-green">
                      <ShieldCheck className="me-1 h-3 w-3" />
                      {t("verified")}
                    </Badge>
                  )}
                  {contractor.reputation_score > 0 && (
                    <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
                      <Star className="h-3 w-3 fill-foreground text-foreground" />
                      {contractor.reputation_score}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-3">
                {contractor.bio && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {contractor.bio}
                  </p>
                )}

                {contractor.service_area && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {contractor.service_area}
                  </div>
                )}

                {contractor.specialties &&
                  contractor.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {contractor.specialties.slice(0, 3).map((s) => (
                        <span
                          key={s}
                          className="rounded-full border px-3 py-0.5 text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground"
                        >
                          {s}
                        </span>
                      ))}
                      {contractor.specialties.length > 3 && (
                        <span className="rounded-full border px-3 py-0.5 text-[10px] font-medium text-muted-foreground">
                          +{contractor.specialties.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                <div className="mt-auto pt-4">
                  <Badge
                    variant="outline"
                    className="mb-3 uppercase tracking-widest text-[10px]"
                  >
                    {SUBSCRIPTION_TIER_LABELS[contractor.subscription_tier]}
                  </Badge>
                  <Link
                    href={`/contractors/${contractor.id}`}
                    className="group flex w-full items-center justify-center gap-2 border border-foreground py-2.5 text-xs font-medium uppercase tracking-[0.15em] transition-colors hover:bg-foreground hover:text-background"
                  >
                    {t("viewProfile")}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function NearbyContractorCard({
  contractor,
  selected,
}: {
  contractor: NearbyContractor;
  selected?: boolean;
}) {
  const t = useTranslations("contractors");

  return (
    <div
      data-contractor-id={contractor.id}
      className={cn(
        "flex flex-col border p-6 transition-colors",
        selected && "ring-2 ring-foreground"
      )}
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="font-bold">
            {contractor.business_name || t("unnamedBusiness")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {contractor.full_name}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {contractor.verified && (
            <Badge className="bg-trust-green/10 text-trust-green">
              <ShieldCheck className="me-1 h-3 w-3" />
              {t("verified")}
            </Badge>
          )}
          {contractor.is_active_nearby && (
            <Badge className="bg-foreground/10 text-foreground">
              {t("activeNearby")}
            </Badge>
          )}
          {contractor.reputation_score > 0 && (
            <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
              <Star className="h-3 w-3 fill-foreground text-foreground" />
              {contractor.reputation_score}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        {/* Distance Badge */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border px-3 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]">
            <MapPin className="h-3 w-3" />
            {formatDistance(contractor.dist_meters)}
          </span>
          <span className="text-[10px] font-medium text-muted-foreground">
            {getTravelFeeLabel(contractor.dist_meters)}
          </span>
        </div>

        {contractor.bio && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {contractor.bio}
          </p>
        )}

        {contractor.specialties &&
          contractor.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {contractor.specialties.slice(0, 3).map((s) => (
                <span
                  key={s}
                  className="rounded-full border px-3 py-0.5 text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground"
                >
                  {s}
                </span>
              ))}
              {contractor.specialties.length > 3 && (
                <span className="rounded-full border px-3 py-0.5 text-[10px] font-medium text-muted-foreground">
                  +{contractor.specialties.length - 3}
                </span>
              )}
            </div>
          )}

        <div className="mt-auto pt-4">
          <Badge
            variant="outline"
            className="mb-3 uppercase tracking-widest text-[10px]"
          >
            {SUBSCRIPTION_TIER_LABELS[
              contractor.subscription_tier as SubscriptionTier
            ] ?? contractor.subscription_tier}
          </Badge>
          <Link
            href={`/contractors/${contractor.id}`}
            className="group flex w-full items-center justify-center gap-2 border border-foreground py-2.5 text-xs font-medium uppercase tracking-[0.15em] transition-colors hover:bg-foreground hover:text-background"
          >
            {t("viewProfile")}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
