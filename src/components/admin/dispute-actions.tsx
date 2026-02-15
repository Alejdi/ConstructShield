"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  resolveDisputeRefund,
  resolveDisputeRelease,
} from "@/actions/admin";
import { Button } from "@/components/ui/button";

interface DisputeActionsProps {
  projectId: string;
}

export function DisputeActions({ projectId }: DisputeActionsProps) {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => {
          startTransition(() => resolveDisputeRefund(projectId));
        }}
      >
        {isPending ? t("admin.processing") : t("admin.refundClient")}
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => {
          startTransition(() => resolveDisputeRelease(projectId));
        }}
      >
        {isPending ? t("admin.processing") : t("admin.releaseToContractor")}
      </Button>
    </div>
  );
}
