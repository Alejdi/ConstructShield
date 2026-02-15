"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { AlertCircle, Clock } from "lucide-react";

interface SubscriptionBannerProps {
  subscriptionStatus: string;
  trialEndsAt: string;
}

export function SubscriptionBanner({
  subscriptionStatus,
  trialEndsAt,
}: SubscriptionBannerProps) {
  const t = useTranslations();

  const now = new Date();
  const trialEnd = new Date(trialEndsAt);
  const daysLeft = Math.max(
    0,
    Math.ceil((trialEnd.getTime() - now.getTime()) / 86400000)
  );

  // Active paid subscription — no banner needed
  if (subscriptionStatus === "active") return null;

  // Trial with more than 3 days left — no banner
  if (subscriptionStatus === "trialing" && daysLeft > 3) return null;

  // Trial ending soon
  if (subscriptionStatus === "trialing" && daysLeft > 0) {
    return (
      <div className="flex items-center gap-4 border border-warning-amber/30 p-5">
        <Clock className="h-5 w-5 shrink-0 text-warning-amber" />
        <div className="flex-1">
          <p className="font-medium">
            {t("subscriptions.trialEndsIn", { days: daysLeft })}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("subscriptions.subscribeNow")}
          </p>
        </div>
        <Link
          href="/contractor/subscription"
          className="inline-flex items-center border border-foreground px-5 py-2.5 text-xs font-medium uppercase tracking-[0.15em] transition-colors hover:bg-foreground hover:text-background"
        >
          {t("subscriptions.subscribe")}
        </Link>
      </div>
    );
  }

  // Past due
  if (subscriptionStatus === "past_due") {
    return (
      <div className="flex items-center gap-4 border border-warning-amber/30 p-5">
        <AlertCircle className="h-5 w-5 shrink-0 text-warning-amber" />
        <div className="flex-1">
          <p className="font-medium">{t("subscriptions.paymentPastDue")}</p>
          <p className="text-sm text-muted-foreground">
            {t("subscriptions.updatePaymentDesc")}
          </p>
        </div>
        <Link
          href="/contractor/subscription"
          className="inline-flex items-center border border-foreground px-5 py-2.5 text-xs font-medium uppercase tracking-[0.15em] transition-colors hover:bg-foreground hover:text-background"
        >
          {t("subscriptions.updatePayment")}
        </Link>
      </div>
    );
  }

  // Expired / canceled / trial ended
  return (
    <div className="flex items-center gap-4 border border-danger-red/30 p-5">
      <AlertCircle className="h-5 w-5 shrink-0 text-danger-red" />
      <div className="flex-1">
        <p className="font-medium">{t("subscriptions.subscriptionRequired")}</p>
        <p className="text-sm text-muted-foreground">
          {t("subscriptions.subscriptionRequiredDesc")}
        </p>
      </div>
      <Link
        href="/contractor/subscription"
        className="inline-flex items-center bg-foreground px-5 py-2.5 text-xs font-medium uppercase tracking-[0.15em] text-background transition-colors hover:bg-foreground/90"
      >
        {t("subscriptions.subscribeNowBtn")}
      </Link>
    </div>
  );
}
