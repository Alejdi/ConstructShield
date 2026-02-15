"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Navigation, MapPin } from "lucide-react";
import { SEARCH_RADIUS_OPTIONS } from "@/lib/constants";
import { formatDistance, formatCurrency, cn } from "@/lib/utils";
import { searchNearbyJobs, type NearbyJob } from "@/actions/marketplace";
import { useTranslations } from "next-intl";
import { MapWithList } from "@/components/map/map-with-list";
import type { MapMarkerData } from "@/components/map";

interface NearbyJobBoardProps {
  children: React.ReactNode;
  initialJobCount: number;
}

export function NearbyJobBoard({
  children,
  initialJobCount,
}: NearbyJobBoardProps) {
  const t = useTranslations("marketplace");

  const [nearbyJobs, setNearbyJobs] = useState<NearbyJob[] | null>(null);
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
      setNearbyJobs(null);
      return;
    }

    searchNearbyJobs(userCoords.lat, userCoords.lng, selectedRadius)
      .then(setNearbyJobs)
      .catch(() => setNearbyJobs(null));
  }, [userCoords, selectedRadius]);

  const showNearby = nearbyJobs !== null && selectedRadius !== 0;
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const jobMarkers: MapMarkerData[] = useMemo(() => {
    if (!nearbyJobs) return [];
    return nearbyJobs
      .filter((j) => j.latitude != null && j.longitude != null)
      .map((j) => ({
        id: j.id,
        position: [j.latitude!, j.longitude!] as [number, number],
        label: j.title,
      }));
  }, [nearbyJobs]);

  const handleMarkerClick = useCallback((id: string) => {
    setSelectedJobId(id);
    const el = document.querySelector(`[data-job-id="${id}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  return (
    <>
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

      {showNearby ? (
        <>
          <p className="mb-4 text-xs text-muted-foreground">
            {t("nearbyJobsFound", { count: nearbyJobs.length })}
          </p>
          {nearbyJobs.length === 0 ? (
            <div className="border-t py-20 text-center">
              <p className="text-muted-foreground">
                {t("noJobsNearby", { distance: formatDistance(selectedRadius) })}
              </p>
              <button
                onClick={() => setSelectedRadius(0)}
                className="mt-3 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground underline transition-colors hover:text-foreground"
              >
                {t("showAllJobs")}
              </button>
            </div>
          ) : jobMarkers.length > 0 && userCoords ? (
            <MapWithList
              markers={jobMarkers}
              center={[userCoords.lat, userCoords.lng]}
              onMarkerClick={handleMarkerClick}
              selectedId={selectedJobId}
            >
              <div className="space-y-2">
                {nearbyJobs.map((job) => (
                  <NearbyJobCard key={job.id} job={job} selected={selectedJobId === job.id} />
                ))}
              </div>
            </MapWithList>
          ) : (
            <div className="space-y-2">
              {nearbyJobs.map((job) => (
                <NearbyJobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <p className="mb-4 text-xs text-muted-foreground">
            {t("jobsFound", { count: initialJobCount })}
          </p>
          {children}
        </>
      )}
    </>
  );
}

function NearbyJobCard({ job, selected }: { job: NearbyJob; selected?: boolean }) {
  const t = useTranslations("marketplace");

  return (
    <a
      href={`/marketplace/jobs/${job.id}`}
      data-job-id={job.id}
      className={cn(
        "block border p-6 transition-colors hover:bg-muted/50",
        selected && "ring-2 ring-foreground"
      )}
    >
      <div className="flex items-start gap-4">
        {job.thumbnail_url && (
          <div className="hidden h-20 w-20 shrink-0 overflow-hidden rounded border sm:block">
            <img
              src={job.thumbnail_url}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold">{job.title}</h3>
          {job.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {job.description}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {formatCurrency(job.total_budget)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border px-3 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]">
              <MapPin className="h-3 w-3" />
              {formatDistance(job.dist_meters)}
            </span>
            {job.address && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {job.address}
              </span>
            )}
          </div>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {t("postedBy", { name: job.client_name })}
      </p>
    </a>
  );
}
