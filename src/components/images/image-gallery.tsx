"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteProjectImage } from "@/actions/project-images";

export interface ProjectImage {
  id: string;
  storage_path: string;
  caption: string | null;
  display_order: number;
}

interface ImageGalleryProps {
  images: ProjectImage[];
  supabaseUrl: string;
  canDelete?: boolean;
}

function getImageUrl(supabaseUrl: string, storagePath: string) {
  return `${supabaseUrl}/storage/v1/object/public/project-images/${storagePath}`;
}

export function ImageGallery({
  images,
  supabaseUrl,
  canDelete = false,
}: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations();

  const sorted = [...images].sort(
    (a, b) => a.display_order - b.display_order
  );

  function handleDelete(imageId: string) {
    if (!confirm(t("images.deleteConfirm"))) return;

    startTransition(async () => {
      const result = await deleteProjectImage(imageId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t("images.deleted"));
        if (selectedIndex !== null) setSelectedIndex(null);
        router.refresh();
      }
    });
  }

  if (sorted.length === 0) return null;

  return (
    <>
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
        {sorted.map((image, idx) => (
          <div
            key={image.id}
            className="group relative aspect-video cursor-pointer overflow-hidden rounded-lg border"
            onClick={() => setSelectedIndex(idx)}
          >
            <img
              src={getImageUrl(supabaseUrl, image.storage_path)}
              alt={image.caption || "Project image"}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
            {image.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent p-3">
                <p className="text-xs text-white">{image.caption}</p>
              </div>
            )}
            {canDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(image.id);
                }}
                disabled={isPending}
                className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100 disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <X className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </div>
        ))}
      </div>

      <Dialog
        open={selectedIndex !== null}
        onOpenChange={() => setSelectedIndex(null)}
      >
        <DialogContent className="max-w-4xl p-2 sm:p-4">
          {selectedIndex !== null && (
            <div className="relative">
              <img
                src={getImageUrl(supabaseUrl, sorted[selectedIndex].storage_path)}
                alt={sorted[selectedIndex].caption || "Project image"}
                className="w-full rounded"
              />
              {sorted[selectedIndex].caption && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {sorted[selectedIndex].caption}
                </p>
              )}

              {sorted.length > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIndex(
                        (selectedIndex - 1 + sorted.length) % sorted.length
                      );
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIndex(
                        (selectedIndex + 1) % sorted.length
                      );
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}

              <p className="mt-1 text-center text-xs text-muted-foreground">
                {selectedIndex + 1} / {sorted.length}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
