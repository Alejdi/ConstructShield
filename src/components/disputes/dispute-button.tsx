"use client";

import { useState } from "react";
import { openDispute } from "@/actions/disputes";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface DisputeButtonProps {
  projectId: string;
}

export function DisputeButton({ projectId }: DisputeButtonProps) {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit() {
    if (reason.trim().length < 10) {
      toast.error(t("disputes.reasonTooShort"));
      return;
    }

    setIsLoading(true);
    try {
      await openDispute(projectId, reason);
      toast.success(t("disputes.openedMsg"));
      setIsOpen(false);
      setReason("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("disputes.openFailed")
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-danger-red hover:bg-danger-red/10"
      >
        <AlertTriangle className="me-2 h-4 w-4" />
        {t("disputes.openDispute")}
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder={t("disputes.reasonPlaceholder")}
        rows={3}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="destructive"
          onClick={handleSubmit}
          disabled={isLoading || reason.trim().length < 10}
        >
          <AlertTriangle className="me-2 h-4 w-4" />
          {isLoading ? t("disputes.submitting") : t("disputes.confirmDispute")}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setIsOpen(false);
            setReason("");
          }}
          disabled={isLoading}
        >
          {t("common.cancel")}
        </Button>
      </div>
    </div>
  );
}
