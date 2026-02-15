import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  FolderOpen,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Star,
  Gavel,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { projectStatusKey, bidStatusKey } from "@/lib/i18n-constants";
import { BID_STATUS_COLORS } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/utils";
import type { ProjectStatus, MilestoneStatus, BidStatus } from "@/lib/types/database";
import { SubscriptionBanner } from "@/components/subscription/subscription-banner";
import { getTranslations } from "next-intl/server";

type ProjectWithMilestones = {
  id: string;
  title: string;
  total_budget: number;
  status: ProjectStatus;
  milestones: { id: string; status: MilestoneStatus; amount: number }[] | null;
};

export const metadata = {
  title: "Contractor Dashboard - ConstructShield",
};

export default async function ContractorDashboardPage() {
  const t = await getTranslations();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: contractorData } = await supabase
    .from("contractors")
    .select("stripe_connect_account_id, verified, subscription_status, trial_ends_at")
    .eq("id", user.id)
    .single();

  const contractor = contractorData as {
    stripe_connect_account_id: string | null;
    verified: boolean;
    subscription_status: string;
    trial_ends_at: string;
  } | null;

  const { data } = await supabase
    .from("projects")
    .select("id, title, total_budget, status, milestones(id, status, amount)")
    .eq("contractor_id", user.id)
    .order("created_at", { ascending: false });

  const projects = (data ?? []) as unknown as ProjectWithMilestones[];

  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const totalEarned = projects.reduce(
    (sum, p) =>
      sum +
      (p.milestones
        ?.filter((m) => m.status === "released")
        .reduce((mSum, m) => mSum + m.amount, 0) ?? 0),
    0
  );
  const pendingMilestones = projects.reduce(
    (sum, p) =>
      sum +
      (p.milestones?.filter(
        (m) =>
          m.status === "funded" ||
          m.status === "work_in_progress" ||
          m.status === "verification_pending"
      ).length ?? 0),
    0
  );

  const hasStripe = !!contractor?.stripe_connect_account_id;

  // Fetch rating
  const { data: ratingData } = await supabase.rpc("get_contractor_rating", {
    p_contractor_id: user.id,
  });
  const ratingRow = (ratingData as { avg_rating: number; review_count: number }[] | null)?.[0];
  const avgRating = ratingRow?.avg_rating ?? 0;
  const reviewCount = Number(ratingRow?.review_count ?? 0);

  // Fetch submitted bids
  const { data: bidsData } = await supabase
    .from("bids")
    .select("id, amount, status, created_at, project_id, projects(title)")
    .eq("contractor_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  type BidWithProject = {
    id: string;
    amount: number;
    status: BidStatus;
    created_at: string;
    project_id: string;
    projects: { title: string } | null;
  };

  const myBids = (bidsData ?? []) as unknown as BidWithProject[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("contractor.dashboard")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("contractor.manageJobs")}
        </p>
      </div>

      {/* Subscription Banner */}
      {contractor && (
        <SubscriptionBanner
          subscriptionStatus={contractor.subscription_status}
          trialEndsAt={contractor.trial_ends_at}
        />
      )}

      {/* Stripe Connect Status */}
      {!hasStripe && (
        <div className="flex items-center gap-4 border border-warning-amber/30 p-5">
          <AlertCircle className="h-5 w-5 text-warning-amber" />
          <div className="flex-1">
            <p className="font-medium">{t("contractor.setupPayments")}</p>
            <p className="text-sm text-muted-foreground">
              {t("contractor.connectStripeDesc")}
            </p>
          </div>
          <Link
            href="/contractor/onboarding"
            className="inline-flex items-center gap-2 border border-foreground px-5 py-2.5 text-xs font-medium uppercase tracking-[0.15em] transition-colors hover:bg-foreground hover:text-background"
          >
            <CreditCard className="h-4 w-4" />
            {t("contractor.connectStripe")}
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-1 border-t pt-4">
          <p className="text-4xl font-black tracking-tight">{totalProjects}</p>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {t("contractor.totalJobs")}
          </p>
        </div>
        <div className="space-y-1 border-t pt-4">
          <p className="text-4xl font-black tracking-tight">{activeProjects}</p>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {t("contractor.activeJobs")}
          </p>
        </div>
        <div className="space-y-1 border-t pt-4">
          <p className="text-4xl font-black tracking-tight">
            {formatCurrency(totalEarned)}
          </p>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {t("contractor.totalEarned")}
          </p>
        </div>
        <div className="space-y-1 border-t pt-4">
          <p className="text-4xl font-black tracking-tight">
            {pendingMilestones}
          </p>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {t("contractor.pendingMilestones")}
          </p>
        </div>
        <div className="space-y-1 border-t pt-4">
          <div className="flex items-center gap-1.5">
            <p className="text-4xl font-black tracking-tight">
              {reviewCount > 0 ? avgRating.toFixed(1) : "—"}
            </p>
            {reviewCount > 0 && (
              <Star className="h-5 w-5 fill-foreground text-foreground" />
            )}
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {t("contractor.ratingCount", { count: reviewCount })}
          </p>
        </div>
      </div>

      {/* Payment Status */}
      <div className="flex items-center justify-between border p-5">
        <div>
          <h2 className="font-bold">{t("contractor.paymentStatus")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("contractor.stripeAccount")}
          </p>
        </div>
        {hasStripe ? (
          <Badge className="bg-trust-green/10 text-trust-green">
            <CheckCircle className="me-1 h-3 w-3" />
            {t("contractor.connected")}
          </Badge>
        ) : (
          <Badge variant="secondary">{t("contractor.notConnected")}</Badge>
        )}
      </div>

      {/* My Bids */}
      {myBids.length > 0 && (
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-bold">{t("bids.myBids")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("bids.myBidsDesc")}
            </p>
          </div>
          <div className="space-y-2">
            {myBids.map((bid) => (
              <Link
                key={bid.id}
                href={`/marketplace/jobs/${bid.project_id}`}
                className="flex items-center justify-between border p-4 transition-colors hover:bg-muted/50"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Gavel className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium">
                      {bid.projects?.title ?? t("bids.unknownProject")}
                    </h3>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {formatCurrency(bid.amount)} &middot; {formatRelativeTime(bid.created_at)}
                  </p>
                </div>
                <Badge className={BID_STATUS_COLORS[bid.status]}>
                  {t(bidStatusKey(bid.status))}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Project List */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-bold">{t("contractor.yourJobs")}</h2>
          <p className="text-sm text-muted-foreground">
            {totalProjects === 0
              ? t("contractor.noJobsYet")
              : t("contractor.jobCount", { count: totalProjects })}
          </p>
        </div>

        {totalProjects === 0 ? (
          <div className="flex flex-col items-center gap-4 border-t py-16">
            <FolderOpen className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              {t("contractor.jobsAppearHere")}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {projects?.map((project) => (
              <Link
                key={project.id}
                href={`/contractor/projects/${project.id}`}
                className="flex items-center justify-between border p-4 transition-colors hover:bg-muted/50"
              >
                <div>
                  <h3 className="font-medium">{project.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(project.total_budget)} &middot;{" "}
                    {project.milestones?.length ?? 0} {t("projects.milestones")}
                  </p>
                </div>
                <Badge variant="secondary">
                  {t(projectStatusKey(project.status))}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
