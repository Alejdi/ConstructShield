import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/utils";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";
import { subscriptionTierKey } from "@/lib/i18n-constants";
import type { SubscriptionTier } from "@/lib/types/database";
import { getTranslations } from "next-intl/server";

export const metadata = {
  title: "Revenue - Admin - ConstructShield",
};

type ProjectRow = {
  total_budget: number;
  created_at: string;
  status: string;
};

type ContractorRow = {
  subscription_tier: SubscriptionTier | null;
  stripe_subscription_id: string | null;
};

export default async function AdminRevenuePage() {
  const t = await getTranslations();
  const admin = getSupabaseAdmin();

  const [{ data: projectsData }, { data: contractorsData }] =
    await Promise.all([
      admin
        .from("projects")
        .select("total_budget, created_at, status")
        .in("status", ["active", "completed"]),
      admin
        .from("contractors")
        .select("subscription_tier, stripe_subscription_id"),
    ]);

  const projects = (projectsData ?? []) as ProjectRow[];
  const contractors = (contractorsData ?? []) as ContractorRow[];

  // GMV and platform fees
  const totalGMV = projects.reduce(
    (sum, p) => sum + (p.total_budget || 0),
    0
  );
  const platformFeeRevenue = Math.round(totalGMV * 0.05);

  // Subscription revenue
  const activeSubscribers = contractors.filter(
    (c) => c.stripe_subscription_id
  );
  const tierCounts: Record<string, number> = { basic: 0, pro: 0, elite: 0 };
  activeSubscribers.forEach((c) => {
    if (c.subscription_tier) {
      tierCounts[c.subscription_tier] =
        (tierCounts[c.subscription_tier] || 0) + 1;
    }
  });

  const planMap = new Map(SUBSCRIPTION_PLANS.map((p) => [p.tier, p]));
  const monthlySubscriptionRevenue = Object.entries(tierCounts).reduce(
    (sum, [tier, count]) => {
      const plan = planMap.get(tier as SubscriptionTier);
      return sum + (plan ? plan.monthlyPrice * count : 0);
    },
    0
  );

  // Monthly breakdown (last 12 months)
  const now = new Date();
  const monthlyBreakdown: {
    month: string;
    gmv: number;
    platformFees: number;
    projectCount: number;
  }[] = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthLabel = d.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    const monthStart = d.toISOString();
    const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const monthEnd = nextMonth.toISOString();

    const monthProjects = projects.filter((p) => {
      return p.created_at >= monthStart && p.created_at < monthEnd;
    });

    const gmv = monthProjects.reduce(
      (sum, p) => sum + (p.total_budget || 0),
      0
    );

    monthlyBreakdown.push({
      month: monthLabel,
      gmv,
      platformFees: Math.round(gmv * 0.05),
      projectCount: monthProjects.length,
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("revenue.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("revenue.description")}
        </p>
      </div>

      {/* Revenue Stats */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1 border-t pt-4">
          <p className="text-4xl font-black tracking-tight">
            {formatCurrency(totalGMV)}
          </p>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {t("revenue.totalGMV")}
          </p>
        </div>
        <div className="space-y-1 border-t pt-4">
          <p className="text-4xl font-black tracking-tight">
            {formatCurrency(platformFeeRevenue)}
          </p>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {t("revenue.platformFeeRevenue")}
          </p>
        </div>
        <div className="space-y-1 border-t pt-4">
          <p className="text-4xl font-black tracking-tight">
            {formatCurrency(monthlySubscriptionRevenue)}
          </p>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {t("revenue.monthlySubRevenue")}
          </p>
        </div>
        <div className="space-y-1 border-t pt-4">
          <p className="text-4xl font-black tracking-tight">
            {activeSubscribers.length}
          </p>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {t("revenue.activeSubscribers")}
          </p>
        </div>
      </div>

      {/* Subscription Tier Breakdown */}
      <div>
        <h2 className="mb-4 text-lg font-bold">{t("revenue.subscriptionBreakdown")}</h2>
        <div className="grid gap-8 sm:grid-cols-3">
          {(["basic", "pro", "elite"] as const).map((tier) => {
            const plan = planMap.get(tier)!;
            const count = tierCounts[tier] || 0;
            return (
              <div key={tier} className="space-y-1 border-t pt-4">
                <p className="text-4xl font-black tracking-tight">{count}</p>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  {t(subscriptionTierKey(tier))} ({formatCurrency(plan.monthlyPrice)}
                  /mo)
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      <div>
        <h2 className="mb-4 text-lg font-bold">{t("revenue.monthlyBreakdown")}</h2>
        <div className="border">
          <div className="grid grid-cols-4 border-b px-4 py-3 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
            <span>{t("revenue.month")}</span>
            <span className="text-right">{t("revenue.projects")}</span>
            <span className="text-right">{t("revenue.gmv")}</span>
            <span className="text-right">{t("revenue.platformFees")}</span>
          </div>
          {monthlyBreakdown.map((row) => (
            <div
              key={row.month}
              className="grid grid-cols-4 border-b px-4 py-3 text-sm last:border-b-0"
            >
              <span className="font-medium">{row.month}</span>
              <span className="text-right text-muted-foreground">
                {row.projectCount}
              </span>
              <span className="text-right">{formatCurrency(row.gmv)}</span>
              <span className="text-right">
                {formatCurrency(row.platformFees)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
