"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn, formatCurrency } from "@/lib/utils";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";
import type { SubscriptionTier } from "@/lib/types/database";
import { Check } from "lucide-react";

interface SubscriptionPlansProps {
  currentTier: SubscriptionTier;
  subscriptionStatus: string;
}

export function SubscriptionPlans({
  currentTier,
  subscriptionStatus,
}: SubscriptionPlansProps) {
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState<string | null>(null);
  const t = useTranslations();

  const isActive =
    subscriptionStatus === "active" || subscriptionStatus === "trialing";

  async function handleSubscribe(tier: SubscriptionTier) {
    setLoading(tier);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, interval }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(null);
    }
  }

  async function handleManage() {
    setLoading("manage");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(null);
    }
  }

  return (
    <div>
      {/* Interval Toggle */}
      <div className="mb-8 flex justify-center">
        <div className="inline-flex border">
          <button
            onClick={() => setInterval("monthly")}
            className={cn(
              "px-5 py-2.5 text-xs font-medium uppercase tracking-[0.15em] transition-colors",
              interval === "monthly"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t("subscriptions.monthly")}
          </button>
          <button
            onClick={() => setInterval("yearly")}
            className={cn(
              "px-5 py-2.5 text-xs font-medium uppercase tracking-[0.15em] transition-colors",
              interval === "yearly"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t("subscriptions.yearly")}
            <span className="ms-1.5 text-[10px] opacity-60">{t("subscriptions.save20")}</span>
          </button>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const isCurrent = isActive && currentTier === plan.tier;
          const price =
            interval === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
          const perMonth =
            interval === "yearly"
              ? Math.round(plan.yearlyPrice / 12)
              : plan.monthlyPrice;

          return (
            <div
              key={plan.tier}
              className={cn(
                "flex flex-col border p-6",
                isCurrent && "border-foreground"
              )}
            >
              {isCurrent && (
                <span className="mb-3 inline-block self-start bg-foreground px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-background">
                  {t("subscriptions.currentPlan")}
                </span>
              )}

              <h3 className="text-lg font-bold">{plan.name}</h3>

              <div className="mt-2">
                <span className="text-3xl font-black tracking-tight">
                  {formatCurrency(perMonth)}
                </span>
                <span className="text-sm text-muted-foreground">{t("subscriptions.perMonth")}</span>
              </div>

              {interval === "yearly" && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatCurrency(price)} {t("subscriptions.billedYearly")}
                </p>
              )}

              <ul className="mt-6 flex-1 space-y-3">
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-3.5 w-3.5 text-trust-green" />
                  {plan.bidsPerMonth === Infinity
                    ? t("subscriptions.unlimitedBids")
                    : t("subscriptions.bidsPerMonth", { count: plan.bidsPerMonth })}
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-3.5 w-3.5 text-trust-green" />
                  {plan.maxListings === Infinity
                    ? t("subscriptions.unlimitedListings")
                    : t("subscriptions.listingsCount", { count: plan.maxListings })}
                </li>
                {plan.prioritySearch && (
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-3.5 w-3.5 text-trust-green" />
                    {t("subscriptions.prioritySearch")}
                  </li>
                )}
              </ul>

              <div className="mt-6">
                {isCurrent ? (
                  <button
                    onClick={handleManage}
                    disabled={loading === "manage"}
                    className="w-full border border-foreground px-6 py-3 text-xs font-medium uppercase tracking-[0.15em] transition-colors hover:bg-foreground hover:text-background disabled:opacity-50"
                  >
                    {loading === "manage" ? t("common.loading") : t("subscriptions.managePlan")}
                  </button>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan.tier)}
                    disabled={loading === plan.tier}
                    className="w-full bg-foreground px-6 py-3 text-xs font-medium uppercase tracking-[0.15em] text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
                  >
                    {loading === plan.tier
                      ? t("common.loading")
                      : isActive
                        ? t("subscriptions.switchPlan")
                        : t("subscriptions.subscribe")}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
