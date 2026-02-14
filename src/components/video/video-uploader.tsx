"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, Camera, CheckCircle, Loader2 } from "lucide-react";

interface VideoUploaderProps {
  type: "proof" | "hype";
  referenceId: string;
  onUploadComplete?: () => void;
}

export function VideoUploader({
  type,
  referenceId,
  onUploadComplete,
}: VideoUploaderProps) {
  const [status, setStatus] = useState<
    "idle" | "preparing" | "uploading" | "complete"
  >("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("preparing");

    try {
      // Get Mux upload URL
      const res = await fetch("/api/mux/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, referenceId }),
      });

      const { uploadUrl } = await res.json();

      setStatus("uploading");

      // Upload directly to Mux
      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      setStatus("complete");
      toast.success("Video uploaded! Processing will take a moment.");
      onUploadComplete?.();
    } catch {
      setStatus("idle");
      toast.error("Upload failed. Please try again.");
    }
  }

  if (status === "complete") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8">
        <CheckCircle className="h-10 w-10 text-trust-green" />
        <p className="text-sm font-medium text-trust-green">
          Upload complete! Video is processing.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {status === "uploading" || status === "preparing" ? (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
          <p className="text-sm text-muted-foreground">
            {status === "preparing" ? "Preparing upload..." : "Uploading video..."}
          </p>
        </>
      ) : (
        <>
          <div className="flex gap-3">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="h-20 w-32"
            >
              <div className="flex flex-col items-center gap-1">
                <Upload className="h-6 w-6" />
                <span className="text-xs">Choose File</span>
              </div>
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="h-20 w-32 bg-brand-600 text-lg font-bold hover:bg-brand-700"
            >
              <div className="flex flex-col items-center gap-1">
                <Camera className="h-6 w-6" />
                <span className="text-xs">Record</span>
              </div>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Record or upload a video showing the completed work
          </p>
        </>
      )}
    </div>
  );
}
