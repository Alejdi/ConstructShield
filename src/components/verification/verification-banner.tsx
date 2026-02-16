"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ShieldAlert, Clock } from "lucide-react";

interface VerificationBannerProps {
  verificationStatus: string;
  role: "client" | "contractor";
}

export function VerificationBanner({
  verificationStatus,
  role,
}: VerificationBannerProps) {
  const t = useTranslations("verification");

  if (verificationStatus === "approved") return null;

  if (verificationStatus === "pending") {
    return (
      <div className="flex items-center gap-4 border border-warning-amber/30 p-5">
        <Clock className="h-5 w-5 shrink-0 text-warning-amber" />
        <div className="flex-1">
          <p className="font-medium">{t("bannerPending")}</p>
          <p className="text-sm text-muted-foreground">
            {t("bannerPendingDesc")}
          </p>
        </div>
      </div>
    );
  }

  if (verificationStatus === "rejected") {
    return (
      <div className="flex items-center gap-4 border border-danger-red/30 p-5">
        <ShieldAlert className="h-5 w-5 shrink-0 text-danger-red" />
        <div className="flex-1">
          <p className="font-medium">{t("bannerRejected")}</p>
          <p className="text-sm text-muted-foreground">
            {t("bannerRejectedDesc")}
          </p>
        </div>
        <Link
          href="/settings"
          className="inline-flex items-center bg-foreground px-5 py-2.5 text-xs font-medium uppercase tracking-[0.15em] text-background transition-colors hover:bg-foreground/90"
        >
          {t("goToSettings")}
        </Link>
      </div>
    );
  }

  // Unverified
  return (
    <div className="flex items-center gap-4 border border-danger-red/30 p-5">
      <ShieldAlert className="h-5 w-5 shrink-0 text-danger-red" />
      <div className="flex-1">
        <p className="font-medium">{t("bannerUnverified")}</p>
        <p className="text-sm text-muted-foreground">
          {role === "client"
            ? t("bannerUnverifiedClientDesc")
            : t("bannerUnverifiedContractorDesc")}
        </p>
      </div>
      <Link
        href="/settings"
        className="inline-flex items-center bg-foreground px-5 py-2.5 text-xs font-medium uppercase tracking-[0.15em] text-background transition-colors hover:bg-foreground/90"
      >
        {t("goToSettings")}
      </Link>
    </div>
  );
}
