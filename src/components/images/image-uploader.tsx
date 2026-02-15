"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ImageIcon, Upload, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ImagePreview {
  id: string;
  file: File;
  preview: string;
  status: "pending" | "uploading" | "complete" | "error";
  caption: string;
}

interface ImageUploaderProps {
  projectId: string;
  existingCount: number;
  onUploadComplete?: () => void;
}

const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export function ImageUploader({
  projectId,
  existingCount,
  onUploadComplete,
}: ImageUploaderProps) {
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const t = useTranslations();

  const remaining = MAX_IMAGES - existingCount - images.length;

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    if (files.length > remaining) {
      toast.error(t("images.maxReached", { count: remaining }));
      return;
    }

    const oversized = files.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      toast.error(t("images.fileTooLarge"));
      return;
    }

    const newImages: ImagePreview[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      status: "pending",
      caption: "",
    }));

    setImages((prev) => [...prev, ...newImages]);

    // Reset input so the same files can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeImage(id: string) {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) URL.revokeObjectURL(img.preview);
      return prev.filter((i) => i.id !== id);
    });
  }

  function updateCaption(id: string, caption: string) {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, caption } : img))
    );
  }

  async function handleUpload() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error(t("images.loginRequired"));
      return;
    }

    setIsUploading(true);

    try {
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        if (image.status === "complete") continue;

        setImages((prev) =>
          prev.map((img) =>
            img.id === image.id ? { ...img, status: "uploading" } : img
          )
        );

        const ext = image.file.name.split(".").pop() ?? "jpg";
        const filePath = `${projectId}/${crypto.randomUUID()}.${ext}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("project-images")
          .upload(filePath, image.file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Insert metadata row
        const { error: dbError } = await supabase
          .from("project_images")
          .insert({
            project_id: projectId,
            storage_path: filePath,
            display_order: existingCount + i,
            caption: image.caption || null,
            uploaded_by: user.id,
          });

        if (dbError) throw dbError;

        setImages((prev) =>
          prev.map((img) =>
            img.id === image.id ? { ...img, status: "complete" } : img
          )
        );
      }

      toast.success(t("images.uploadSuccess"));
      // Clean up previews
      images.forEach((img) => URL.revokeObjectURL(img.preview));
      setImages([]);
      onUploadComplete?.();
      router.refresh();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(t("images.uploadFailed"));
      setImages((prev) =>
        prev.map((img) =>
          img.status === "uploading" ? { ...img, status: "error" } : img
        )
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {remaining > 0 && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex w-full flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
        >
          <ImageIcon className="h-8 w-8" />
          <div className="text-center">
            <p className="text-sm font-medium">{t("images.clickToAdd")}</p>
            <p className="text-xs">
              {t("images.fileTypes", { remaining })}
            </p>
          </div>
        </button>
      )}

      {images.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {images.map((image) => (
            <div key={image.id} className="space-y-2 rounded-lg border p-3">
              <div className="relative aspect-video overflow-hidden rounded bg-muted">
                <img
                  src={image.preview}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
                {image.status === "uploading" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
                {!isUploading && (
                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/75"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Input
                placeholder={t("images.captionPlaceholder")}
                value={image.caption}
                onChange={(e) => updateCaption(image.id, e.target.value)}
                disabled={isUploading}
                className="text-xs"
              />
            </div>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <Button
          onClick={handleUpload}
          disabled={
            isUploading || images.every((img) => img.status === "complete")
          }
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
              {t("images.uploading")}
            </>
          ) : (
            <>
              <Upload className="me-2 h-4 w-4" />
              {t("images.uploadCount", { count: images.length })}
            </>
          )}
        </Button>
      )}
    </div>
  );
}
