import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SubscriptionPlans } from "@/components/subscription/subscription-plans";
import { subscriptionTierKey } from "@/lib/i18n-constants";
import { formatDate } from "@/lib/utils";
import type { SubscriptionTier } from "@/lib/types/database";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";

export const metadata = {
  title: "Subscription - ConstructShield",
};

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const t = await getTranslations();
  const { success } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: contractorData } = await supabase
    .from("contractors")
    .select(
      "subscription_tier, subscription_status, trial_ends_at, current_period_end"
    )
    .eq("id", user.id)
    .single();

  const contractor = contractorData as {
    subscription_tier: SubscriptionTier;
    subscription_status: string;
    trial_ends_at: string;
    current_period_end: string | null;
  } | null;

  if (!contractor) redirect("/login");

  const isTrialing = contractor.subscription_status === "trialing";
  const isActive = contractor.subscription_status === "active";
  const trialEnd = new Date(contractor.trial_ends_at);
  const now = new Date();
  const daysLeft = Math.max(
    0,
    Math.ceil((trialEnd.getTime() - now.getTime()) / 86400000)
  );

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
          {t("nav.settings")}
        </p>
        <h1 className="text-4xl font-bold tracking-tight">{t("subscriptions.title")}</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          {t("subscriptions.manageSubscription")}
        </p>
      </div>

      {/* Success message */}
      {success === "true" && (
        <div className="mb-6 flex items-center gap-3 border border-trust-green/30 p-4">
          <CheckCircle className="h-5 w-5 text-trust-green" />
          <p className="text-sm font-medium text-trust-green">
            {t("subscriptions.activatedSuccess")}
          </p>
        </div>
      )}

      {/* Current status */}
      <div className="mb-8 border p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {t("subscriptions.currentPlan")}
            </p>
            <p className="mt-1 text-lg font-bold">
              {t(subscriptionTierKey(contractor.subscription_tier))}
            </p>
          </div>
          {isActive && (
            <Badge className="bg-trust-green/10 text-trust-green">{t("subscriptions.active")}</Badge>
          )}
          {isTrialing && daysLeft > 0 && (
            <Badge className="bg-warning-amber/10 text-warning-amber">
              {t("subscriptions.trialDaysLeft", { days: daysLeft })}
            </Badge>
          )}
          {!isActive && !isTrialing && (
            <Badge variant="secondary">{t("subscriptions.inactive")}</Badge>
          )}
          {isTrialing && daysLeft === 0 && (
            <Badge className="bg-danger-red/10 text-danger-red">
              {t("subscriptions.trialExpired")}
            </Badge>
          )}
        </div>
        {contractor.current_period_end && isActive && (
          <p className="mt-2 text-xs text-muted-foreground">
            {t("subscriptions.renewsOn", { date: formatDate(contractor.current_period_end) })}
          </p>
        )}
      </div>

      {/* Plans */}
      <SubscriptionPlans
        currentTier={contractor.subscription_tier}
        subscriptionStatus={contractor.subscription_status}
      />
    </div>
  );
}
