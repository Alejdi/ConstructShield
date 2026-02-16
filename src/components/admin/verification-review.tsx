"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ShieldCheck, ShieldAlert, Clock, FileText, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  approveVerification,
  rejectVerification,
  getDocumentSignedUrl,
} from "@/actions/verification";
import { formatRelativeTime } from "@/lib/utils";

interface VerificationReviewProps {
  userId: string;
  role: string;
  verificationStatus: string;
  documentPath: string | null;
  documentType: string | null;
  taxId: string | null;
  rejectedReason: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  unverified: "bg-muted text-muted-foreground",
  pending: "bg-warning-amber/10 text-warning-amber border-warning-amber/30",
  approved: "bg-trust-green/10 text-trust-green border-trust-green/30",
  rejected: "bg-danger-red/10 text-danger-red border-danger-red/30",
};

export function VerificationReview({
  userId,
  role,
  verificationStatus,
  documentPath,
  documentType,
  taxId,
  rejectedReason,
  submittedAt,
  reviewedAt,
}: VerificationReviewProps) {
  const t = useTranslations("verification");
  const [isPending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [viewingDoc, setViewingDoc] = useState(false);

  function handleApprove() {
    startTransition(async () => {
      try {
        await approveVerification(userId);
        toast.success("Verification approved");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to approve");
      }
    });
  }

  function handleReject() {
    if (!rejectReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }
    startTransition(async () => {
      try {
        await rejectVerification(userId, rejectReason);
        toast.success("Verification rejected");
        setRejectOpen(false);
        setRejectReason("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to reject");
      }
    });
  }

  async function handleViewDocument() {
    setViewingDoc(true);
    try {
      const url = await getDocumentSignedUrl(userId);
      window.open(url, "_blank");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load document");
    } finally {
      setViewingDoc(false);
    }
  }

  const docTypeLabels: Record<string, string> = {
    passport: t("passport"),
    drivers_license: t("driversLicense"),
    national_id: t("nationalId"),
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{t("adminReview")}</h3>
        <Badge
          variant="outline"
          className={STATUS_STYLES[verificationStatus] ?? ""}
        >
          {verificationStatus === "approved" && <ShieldCheck className="me-1 h-3 w-3" />}
          {verificationStatus === "pending" && <Clock className="me-1 h-3 w-3" />}
          {verificationStatus === "rejected" && <ShieldAlert className="me-1 h-3 w-3" />}
          {t(`status.${verificationStatus}`)}
        </Badge>
      </div>

      {/* Submission details */}
      {verificationStatus !== "unverified" && (
        <div className="space-y-2 text-sm">
          {role === "client" && documentType && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("adminDocumentType")}</span>
              <span>{docTypeLabels[documentType] ?? documentType}</span>
            </div>
          )}
          {role === "contractor" && taxId && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("adminTaxId")}</span>
              <span className="font-mono">{taxId}</span>
            </div>
          )}
          {submittedAt && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("adminSubmittedAt")}</span>
              <span>{formatRelativeTime(submittedAt)}</span>
            </div>
          )}
          {reviewedAt && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("adminReviewedAt")}</span>
              <span>{formatRelativeTime(reviewedAt)}</span>
            </div>
          )}
          {rejectedReason && (
            <div className="border border-danger-red/20 p-3">
              <p className="text-xs font-medium text-danger-red">{t("adminRejectionReason")}</p>
              <p className="mt-1 text-sm">{rejectedReason}</p>
            </div>
          )}
        </div>
      )}

      {verificationStatus === "unverified" && (
        <p className="text-sm text-muted-foreground">{t("adminNoSubmission")}</p>
      )}

      {/* Actions */}
      {verificationStatus === "pending" && (
        <div className="flex items-center gap-2">
          {role === "client" && documentPath && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewDocument}
              disabled={viewingDoc}
            >
              <FileText className="me-1 h-4 w-4" />
              {t("adminViewDocument")}
              <ExternalLink className="ms-1 h-3 w-3" />
            </Button>
          )}

          <Button
            size="sm"
            className="bg-trust-green hover:bg-trust-green/90"
            onClick={handleApprove}
            disabled={isPending}
          >
            {isPending ? t("adminApproving") : t("adminApprove")}
          </Button>

          <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isPending}>
                {t("adminReject")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("adminReject")}</DialogTitle>
                <DialogDescription>{t("adminRejectionPlaceholder")}</DialogDescription>
              </DialogHeader>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={t("adminRejectionPlaceholder")}
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setRejectOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={isPending || !rejectReason.trim()}
                >
                  {isPending ? t("adminRejecting") : t("adminReject")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
