"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createBrowserClient } from "@supabase/ssr";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  fullName: string;
  userId: string;
  supabaseUrl: string;
}

export function AvatarUpload({
  currentAvatarUrl,
  fullName,
  userId,
  supabaseUrl,
}: AvatarUploadProps) {
  const t = useTranslations();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const displayUrl = previewUrl ?? currentAvatarUrl;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("settings.avatarTooLarge"));
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const ext = file.name.split(".").pop() ?? "jpg";
      const filePath = `${userId}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const avatarUrl = `${supabaseUrl}/storage/v1/object/public/avatars/${filePath}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      toast.success(t("settings.avatarUpdated"));
      router.refresh();
    } catch (err) {
      console.error("Avatar upload error:", err);
      toast.error(t("settings.avatarFailed"));
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar className="h-16 w-16">
          <AvatarImage src={displayUrl ?? undefined} alt={fullName} />
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}
      </div>
      <div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          <Camera className="me-2 h-4 w-4" />
          {t("settings.changeAvatar")}
        </Button>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("settings.avatarHint")}
        </p>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
