"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

export const MapView = dynamic(
  () => import("./map-view").then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-48 items-center justify-center overflow-hidden rounded-md border bg-muted/50 animate-pulse">
        <MapPin className="h-6 w-6 text-muted-foreground" />
      </div>
    ),
  }
);
