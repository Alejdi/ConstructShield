import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/utils";
import { projectStatusKey } from "@/lib/i18n-constants";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { ProjectStatus } from "@/lib/types/database";
import { getTranslations } from "next-intl/server";
import { Users, AlertTriangle, DollarSign, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Admin Overview - ConstructShield",
};

export default async function AdminOverviewPage() {
  const t = await getTranslations();
  const admin = getSupabaseAdmin();

  // Fetch all stats in parallel
  const [
    { count: totalUsers },
    { count: totalClients },
    { count: totalContractors },
    { count: verifiedContractors },
    { count: totalProjects },
    { count: openDisputes },
    { count: activeSubscriptions },
    { data: projectsData },
    { data: disputedProjects },
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "client"),
    admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "contractor"),
    admin
      .from("contractors")
      .select("*", { count: "exact", head: true })
      .eq("verified", true),
    admin.from("projects").select("*", { count: "exact", head: true }),
    admin
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("status", "disputed"),
    admin
      .from("contractors")
      .select("*", { count: "exact", head: true })
      .not("stripe_subscription_id", "is", null),
    admin.from("projects").select("total_budget, status").in("status", ["active", "completed"]),
    admin
      .from("projects")
      .select(
        "id, title, total_budget, status, client_id, contractor_id"
      )
      .eq("status", "disputed")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const projects = (projectsData ?? []) as {
    total_budget: number;
    status: string;
  }[];
  const totalGMV = projects.reduce((sum, p) => sum + (p.total_budget || 0), 0);
  const platformFeeRevenue = Math.round(totalGMV * 0.05);

  const disputes = (disputedProjects ?? []) as {
    id: string;
    title: string;
    total_budget: number;
    status: ProjectStatus;
    client_id: string;
    contractor_id: string | null;
  }[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("admin.overview")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("admin.platformMetrics")}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/admin/users"
          className="group flex items-center gap-4 border p-4 transition-colors hover:bg-muted/50"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-foreground text-background">
            <Users className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{t("admin.manageUsers")}</p>
            <p className="text-xs text-muted-foreground">{t("admin.manageUsersDesc")}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </Link>

        <Link
          href="/admin/disputes"
          className="group flex items-center gap-4 border p-4 transition-colors hover:bg-muted/50"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-foreground text-background">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">
              {t("admin.viewDisputes")}
              {(openDisputes ?? 0) > 0 && (
                <span className="ms-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger-red px-1.5 text-[10px] font-bold text-white">
                  {openDisputes}
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">{t("admin.viewDisputesDesc")}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </Link>

        <Link
          href="/admin/revenue"
          className="group flex items-center gap-4 border p-4 transition-colors hover:bg-muted/50"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-foreground text-background">
            <DollarSign className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{t("admin.viewRevenue")}</p>
            <p className="text-xs text-muted-foreground">{t("admin.viewRevenueDesc")}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Primary Stats */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1 border-t pt-4">
          <p className="text-4xl font-black tracking-tight">
            {totalUsers ?? 0}
          </p>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {t("admin.totalUsers")}
          </p>
        </div>
        <div className="space-y-1 border-t pt-4">
          <p className="text-4xl font-black tracking-tight">
            {totalProjects ?? 0}
          </p>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {t("admin.totalProjects")}
          </p>
        </div>
        <div className="space-y-1 border-t pt-4">
          <p className="text-4xl font-black tracking-tight">
            {formatCurrency(platformFeeRevenue)}
          </p>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {t("admin.platformFeeRevenue")}
          </p>
        </div>
        <div className="space-y-1 border-t pt-4">
          <p className="text-4xl font-black tracking-tight">
            {openDisputes ?? 0}
          </p>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {t("admin.openDisputes")}
          </p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1 border-t pt-4">
          <p className="text-4xl font-black tracking-tight">
            {totalClients ?? 0}
          </p>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {t("admin.clients")}
          </p>
        </div>
        <div className="space-y-1 border-t pt-4">
          <p className="text-4xl font-black tracking-tight">
            {totalContractors ?? 0}
          </p>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {t("admin.contractors")}
          </p>
        </div>
        <div className="space-y-1 border-t pt-4">
          <p className="text-4xl font-black tracking-tight">
            {verifiedContractors ?? 0}
          </p>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {t("admin.verifiedContractors")}
          </p>
        </div>
        <div className="space-y-1 border-t pt-4">
          <p className="text-4xl font-black tracking-tight">
            {activeSubscriptions ?? 0}
          </p>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {t("admin.activeSubscriptions")}
          </p>
        </div>
      </div>

      {/* Recent Disputes */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">{t("admin.recentDisputes")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("admin.disputesDesc")}
            </p>
          </div>
          {(openDisputes ?? 0) > 0 && (
            <Link
              href="/admin/disputes"
              className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground"
            >
              {t("common.viewAll")}
            </Link>
          )}
        </div>

        {disputes.length === 0 ? (
          <div className="flex flex-col items-center gap-2 border-t py-12">
            <p className="text-sm text-muted-foreground">
              {t("admin.noOpenDisputes")}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {disputes.map((dispute) => (
              <Link
                key={dispute.id}
                href="/admin/disputes"
                className="flex items-center justify-between border p-4 transition-colors hover:bg-muted/50"
              >
                <div>
                  <h3 className="font-medium">{dispute.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(dispute.total_budget)}
                  </p>
                </div>
                <Badge variant="secondary">
                  {t(projectStatusKey(dispute.status))}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
