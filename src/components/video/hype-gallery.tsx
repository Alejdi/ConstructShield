"use client";

import { VideoPlayer } from "./video-player";

interface HypeGalleryProps {
  playbackIds: string[];
}

export function HypeGallery({ playbackIds }: HypeGalleryProps) {
  if (playbackIds.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {playbackIds.map((id) => (
        <div key={id} className="aspect-video overflow-hidden rounded-lg">
          <VideoPlayer playbackId={id} className="h-full w-full" />
        </div>
      ))}
    </div>
  );
}
