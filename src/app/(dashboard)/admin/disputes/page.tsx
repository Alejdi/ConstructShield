import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { milestoneStatusKey } from "@/lib/i18n-constants";
import { DisputeActions } from "@/components/admin/dispute-actions";
import type { MilestoneStatus } from "@/lib/types/database";
import { getTranslations } from "next-intl/server";

export const metadata = {
  title: "Disputes - Admin - ConstructShield",
};

type DisputedProject = {
  id: string;
  title: string;
  total_budget: number;
  client_id: string;
  contractor_id: string | null;
};

type MilestoneRow = {
  id: string;
  title: string;
  amount: number;
  status: MilestoneStatus;
  stripe_payment_intent_id: string | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
};

export default async function AdminDisputesPage() {
  const t = await getTranslations();
  const admin = getSupabaseAdmin();

  const { data: projectsData } = await admin
    .from("projects")
    .select("id, title, total_budget, client_id, contractor_id")
    .eq("status", "disputed")
    .order("created_at", { ascending: false });

  const projects = (projectsData ?? []) as DisputedProject[];

  if (projects.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("nav.disputes")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("admin.noOpenDisputes")}
          </p>
        </div>
        <div className="flex flex-col items-center gap-2 border-t py-16">
          <p className="text-sm text-muted-foreground">
            {t("admin.allResolved")}
          </p>
        </div>
      </div>
    );
  }

  // Gather all user IDs for name lookups (will add dispute openers after fetch)
  const userIds = new Set<string>();
  projects.forEach((p) => {
    userIds.add(p.client_id);
    if (p.contractor_id) userIds.add(p.contractor_id);
  });

  const projectIds = projects.map((p) => p.id);

  const [{ data: profilesData }, { data: milestonesData }, { data: disputesData }] = await Promise.all([
    admin
      .from("profiles")
      .select("id, full_name")
      .in("id", Array.from(userIds)),
    admin
      .from("milestones")
      .select("id, title, amount, status, stripe_payment_intent_id, project_id")
      .in("project_id", projectIds)
      .order("order_index", { ascending: true }),
    admin
      .from("disputes")
      .select("project_id, opened_by, reason, created_at")
      .in("project_id", projectIds)
      .order("created_at", { ascending: false }),
  ]);

  const milestonesByProject = new Map<string, MilestoneRow[]>();
  for (const ms of (milestonesData ?? []) as (MilestoneRow & {
    project_id: string;
  })[]) {
    const arr = milestonesByProject.get(ms.project_id) ?? [];
    arr.push(ms);
    milestonesByProject.set(ms.project_id, arr);
  }

  // Build dispute map (latest dispute per project)
  type DisputeRow = { project_id: string; opened_by: string; reason: string; created_at: string };
  const disputeByProject = new Map<string, DisputeRow>();
  for (const d of (disputesData ?? []) as DisputeRow[]) {
    if (!disputeByProject.has(d.project_id)) {
      disputeByProject.set(d.project_id, d);
    }
    // Add dispute opener to profile lookups (they might not be client/contractor)
    userIds.add(d.opened_by);
  }

  const profileMap = new Map(
    ((profilesData ?? []) as ProfileRow[]).map((p) => [p.id, p])
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("nav.disputes")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("admin.disputeCount", { count: projects.length })}
        </p>
      </div>

      <div className="space-y-6">
        {projects.map((project) => {
          const clientName =
            profileMap.get(project.client_id)?.full_name ?? "Unknown";
          const contractorName = project.contractor_id
            ? profileMap.get(project.contractor_id)?.full_name ?? "Unknown"
            : "None";
          const milestones = milestonesByProject.get(project.id) ?? [];

          const dispute = disputeByProject.get(project.id);
          const openedByName = dispute
            ? profileMap.get(dispute.opened_by)?.full_name ?? "Unknown"
            : null;

          return (
            <div key={project.id} className="border">
              <div className="flex items-center justify-between border-b p-4">
                <div>
                  <h3 className="text-lg font-bold">{project.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Budget: {formatCurrency(project.total_budget)} &middot;
                    Client: {clientName} &middot; Contractor: {contractorName}
                  </p>
                </div>
                <DisputeActions projectId={project.id} />
              </div>

              {dispute && (
                <div className="border-b bg-danger-red/5 px-4 py-3">
                  <p className="text-sm">
                    <span className="font-medium">{t("disputes.reason")}:</span>{" "}
                    {dispute.reason}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("disputes.openedBy", { name: openedByName ?? "Unknown" })}
                  </p>
                </div>
              )}

              {milestones.length > 0 && (
                <div className="divide-y">
                  {milestones.map((ms) => (
                    <div
                      key={ms.id}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{ms.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(ms.amount)}
                          {ms.stripe_payment_intent_id && ` · ${t("admin.paymentHeld")}`}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {t(milestoneStatusKey(ms.status))}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
