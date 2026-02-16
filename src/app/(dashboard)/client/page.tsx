import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FolderOpen, PlusCircle } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type { ProjectStatus, MilestoneStatus } from "@/lib/types/database";
import { NearbyActivity } from "@/components/location/nearby-activity";
import { ProjectListFilter } from "@/components/projects/project-list-filter";
import { VerificationBanner } from "@/components/verification/verification-banner";
import { getTranslations } from "next-intl/server";

type ProjectWithMilestones = {
  id: string;
  title: string;
  total_budget: number;
  status: ProjectStatus;
  milestones: { id: string; status: MilestoneStatus; amount: number }[] | null;
  bids: { id: string; status: string }[] | null;
};

export const metadata = {
  title: "Client Dashboard - ConstructShield",
};

export default async function ClientDashboardPage() {
  const t = await getTranslations();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: verifyData } = await supabase
    .from("profiles")
    .select("verification_status")
    .eq("id", user.id)
    .single();
  const verificationStatus = (verifyData as { verification_status: string } | null)?.verification_status ?? "unverified";

  const { data } = await supabase
    .from("projects")
    .select("id, title, total_budget, status, milestones(id, status, amount), bids(id, status)")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false });

  const projects = (data ?? []) as unknown as ProjectWithMilestones[];

  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const totalBudget = projects.reduce(
    (sum, p) => sum + (p.total_budget || 0),
    0
  );
  const activeMilestones = projects.reduce(
    (sum, p) =>
      sum +
      (p.milestones?.filter(
        (m) => m.status !== "released" && m.status !== "waiting_for_funds"
      ).length ?? 0),
    0
  );

  return (
    <div className="space-y-8">
      <VerificationBanner verificationStatus={verificationStatus} role="client" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("nav.dashboard")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("projects.manageProjects")}
          </p>
        </div>
        <Link
          href="/client/projects/new"
          className="inline-flex items-center gap-2 border border-foreground px-5 py-2.5 text-xs font-medium uppercase tracking-[0.15em] transition-colors hover:bg-foreground hover:text-background"
        >
          <PlusCircle className="h-4 w-4" />
          {t("nav.newProject")}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1 border-t pt-4">
          <p className="text-4xl font-black tracking-tight">{totalProjects}</p>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {t("projects.totalProjects")}
          </p>
        </div>
        <div className="space-y-1 border-t pt-4">
          <p className="text-4xl font-black tracking-tight">{activeProjects}</p>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {t("projects.active")}
          </p>
        </div>
        <div className="space-y-1 border-t pt-4">
          <p className="text-4xl font-black tracking-tight">
            {formatCurrency(totalBudget)}
          </p>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {t("projects.totalBudget")}
          </p>
        </div>
        <div className="space-y-1 border-t pt-4">
          <p className="text-4xl font-black tracking-tight">
            {activeMilestones}
          </p>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {t("projects.activeMilestones")}
          </p>
        </div>
      </div>

      {/* Nearby Activity */}
      <NearbyActivity />

      {/* Project List */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-bold">{t("projects.yourProjects")}</h2>
          <p className="text-sm text-muted-foreground">
            {totalProjects === 0
              ? t("projects.noProjectsYet")
              : t("projects.projectCount", { count: totalProjects })}
          </p>
        </div>

        {totalProjects === 0 ? (
          <div className="flex flex-col items-center gap-4 border-t py-16">
            <FolderOpen className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              {t("projects.createFirstProject")}
            </p>
            <Link
              href="/client/projects/new"
              className="inline-flex items-center gap-2 border border-foreground px-5 py-2.5 text-xs font-medium uppercase tracking-[0.15em] transition-colors hover:bg-foreground hover:text-background"
            >
              <PlusCircle className="h-4 w-4" />
              {t("nav.newProject")}
            </Link>
          </div>
        ) : (
          <ProjectListFilter projects={projects} />
        )}
      </div>
    </div>
  );
}
