"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toggleContractorVerification } from "@/actions/admin";
import { Button } from "@/components/ui/button";

interface VerifyButtonProps {
  contractorId: string;
  verified: boolean;
}

export function VerifyButton({ contractorId, verified }: VerifyButtonProps) {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(() => toggleContractorVerification(contractorId));
      }}
    >
      {isPending ? t("admin.updating") : verified ? t("admin.revoke") : t("admin.verify")}
    </Button>
  );
}
