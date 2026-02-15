"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { getNearbyActiveProjects } from "@/actions/contractors";
import { MapPin } from "lucide-react";
import { formatDistance } from "@/lib/utils";
import Link from "next/link";

type NearbyProject = {
  id: string;
  title: string;
  distMeters: number;
  contractorName: string;
};

export function NearbyActivity() {
  const t = useTranslations();
  const [projects, setProjects] = useState<NearbyProject[]>([]);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const result = await getNearbyActiveProjects(
            position.coords.latitude,
            position.coords.longitude
          );
          setProjects(result);
        } catch {
          // Silently fail
        }
      },
      () => {},
      { enableHighAccuracy: false, timeout: 5000 }
    );
  }, []);

  if (projects.length === 0) return null;

  return (
    <div className="mt-8">
      <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
        {t("nearbyCta.activeNearby")}
      </p>
      <div className="space-y-3">
        {projects.slice(0, 3).map((project) => (
          <Link
            key={project.id}
            href={`/contractors`}
            className="flex items-center gap-4 border p-4 transition-colors hover:bg-muted/50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border">
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{project.title}</p>
              <p className="text-xs text-muted-foreground">
                {t("nearbyCta.contractorNearby", { name: project.contractorName, distance: formatDistance(project.distMeters) })}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
