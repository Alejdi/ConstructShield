"use client";

import { useState, useRef, useActionState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createBrowserClient } from "@supabase/ssr";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShieldCheck, Upload, Loader2, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { submitClientVerification, type VerificationState } from "@/actions/verification";

interface ClientVerificationCardProps {
  verificationStatus: string;
  documentType: string | null;
  rejectedReason: string | null;
  userId: string;
  supabaseUrl: string;
}

export function ClientVerificationCard({
  verificationStatus,
  documentType,
  rejectedReason,
  userId,
  supabaseUrl,
}: ClientVerificationCardProps) {
  const t = useTranslations("verification");
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<string>("");

  const [state, formAction, isPending] = useActionState<VerificationState, FormData>(
    async (_prevState: VerificationState, formData: FormData) => {
      const result = await submitClientVerification(_prevState, formData);
      if (result.success) {
        toast.success(t("submitted"));
        router.refresh();
      } else if (result.error) {
        toast.error(result.error);
      }
      return result;
    },
    { error: null, success: false }
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!selectedFile || !selectedDocType) {
      toast.error(t("selectDocumentType"));
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error(t("fileTooLarge"));
      return;
    }

    setUploading(true);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const ext = selectedFile.name.split(".").pop() ?? "jpg";
      const filePath = `${userId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("id-documents")
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Now call server action with metadata
      const formData = new FormData();
      formData.set("documentType", selectedDocType);
      formData.set("storagePath", filePath);
      formAction(formData);
    } catch (err) {
      console.error("Document upload error:", err);
      toast.error(t("uploadFailed"));
    } finally {
      setUploading(false);
    }
  }

  // Approved state
  if (verificationStatus === "approved") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-trust-green" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("approvedMessage")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Pending state
  if (verificationStatus === "pending") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-warning-amber" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("pendingMessage")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Unverified or rejected — show form
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("clientTitle")}</CardTitle>
        <CardDescription>{t("clientDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        {verificationStatus === "rejected" && rejectedReason && (
          <div className="mb-4 flex items-start gap-3 border border-danger-red/30 p-4">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger-red" />
            <div>
              <p className="text-sm font-medium">{t("rejectedMessage")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("rejectedReason", { reason: rejectedReason })}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{t("canResubmit")}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("documentType")}</Label>
            <Select value={selectedDocType} onValueChange={setSelectedDocType}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectDocumentType")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="passport">{t("passport")}</SelectItem>
                <SelectItem value="drivers_license">{t("driversLicense")}</SelectItem>
                <SelectItem value="national_id">{t("nationalId")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("uploadDocument")}</Label>
            <div
              className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors hover:bg-muted/50"
              onClick={() => fileRef.current?.click()}
            >
              {selectedFile ? (
                <p className="text-sm">{selectedFile.name}</p>
              ) : (
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">{t("clickToUpload")}</p>
                  <p className="text-xs text-muted-foreground">{t("acceptedFormats")}</p>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
          </div>

          <Button
            type="submit"
            disabled={uploading || isPending || !selectedFile || !selectedDocType}
          >
            {uploading || isPending ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {t("submitting")}
              </>
            ) : (
              t("submit")
            )}
          </Button>

          {state.error && (
            <p className="text-sm text-danger-red">{state.error}</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
