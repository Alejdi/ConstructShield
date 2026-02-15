"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { getNearbyCount } from "@/actions/contractors";
import { ArrowRight } from "lucide-react";

export function NearByCTA() {
  const t = useTranslations();
  const [data, setData] = useState<{
    contractors: number;
    activeProjects: number;
  } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const result = await getNearbyCount(latitude, longitude);
          if (result.contractors > 0) {
            setData(result);
          }
        } catch {
          // Silently fail
        }
      },
      () => {
        // Location denied — render nothing
      },
      { enableHighAccuracy: false, timeout: 5000 }
    );
  }, []);

  if (!data) return null;

  return (
    <section className="border-t bg-foreground px-6 py-12 text-background lg:px-12">
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-bold leading-snug sm:text-xl">
            {t("nearbyCta.buildersNearby", { count: data.contractors })}
          </p>
          {data.activeProjects > 0 && (
            <p className="mt-1 text-sm text-background/60">
              {t("nearbyCta.activeProjects", { count: data.activeProjects })}
            </p>
          )}
        </div>
        <Link
          href="/contractors"
          className="group inline-flex shrink-0 items-center gap-3 border border-background/30 px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] transition-colors hover:bg-background hover:text-foreground"
        >
          {t("nearbyCta.seeWhos")}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}
