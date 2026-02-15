"use client";

import { useState } from "react";
import { MapView } from "@/components/map";
import type { MapMarkerData } from "@/components/map";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface MapWithListProps {
  markers: MapMarkerData[];
  center: [number, number];
  children: React.ReactNode;
  onMarkerClick?: (id: string) => void;
  selectedId?: string | null;
}

export function MapWithList({
  markers,
  center,
  children,
  onMarkerClick,
  selectedId,
}: MapWithListProps) {
  const t = useTranslations("map");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  return (
    <>
      {/* Mobile toggle */}
      <div className="mb-4 flex gap-2 lg:hidden">
        <button
          onClick={() => setViewMode("list")}
          className={cn(
            "rounded-full border px-4 py-1.5 text-xs font-medium uppercase tracking-[0.1em] transition-colors",
            viewMode === "list"
              ? "border-foreground bg-foreground text-background"
              : "text-muted-foreground hover:border-foreground hover:text-foreground"
          )}
        >
          {t("showList")}
        </button>
        <button
          onClick={() => setViewMode("map")}
          className={cn(
            "rounded-full border px-4 py-1.5 text-xs font-medium uppercase tracking-[0.1em] transition-colors",
            viewMode === "map"
              ? "border-foreground bg-foreground text-background"
              : "text-muted-foreground hover:border-foreground hover:text-foreground"
          )}
        >
          {t("showMap")}
        </button>
      </div>

      {/* Mobile: conditional view */}
      <div className="lg:hidden">
        {viewMode === "map" ? (
          <MapView
            center={center}
            markers={markers}
            className="h-[50vh]"
            onMarkerClick={onMarkerClick}
            selectedMarkerId={selectedId}
          />
        ) : (
          children
        )}
      </div>

      {/* Desktop: side-by-side */}
      <div className="hidden lg:flex lg:gap-6">
        <div className="min-w-0 flex-1 overflow-y-auto">{children}</div>
        <div className="w-[45%] shrink-0">
          <div className="sticky top-0">
            <MapView
              center={center}
              markers={markers}
              className="h-[calc(100vh-12rem)]"
              onMarkerClick={onMarkerClick}
              selectedMarkerId={selectedId}
            />
          </div>
        </div>
      </div>
    </>
  );
}
