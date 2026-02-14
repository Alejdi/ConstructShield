import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FolderOpen,
  DollarSign,
  Clock,
  CreditCard,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { PROJECT_STATUS_LABELS } from "@/lib/constants";
import type { ProjectStatus, MilestoneStatus } from "@/lib/types/database";

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: contractorData } = await supabase
    .from("contractors")
    .select("stripe_connect_account_id, verified")
    .eq("id", user.id)
    .single();

  const contractor = contractorData as {
    stripe_connect_account_id: string | null;
    verified: boolean;
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Contractor Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your jobs and earnings
        </p>
      </div>

      {/* Stripe Connect Status */}
      {!hasStripe && (
        <Card className="border-warning-amber/50 bg-warning-amber/5">
          <CardContent className="flex items-center gap-4 pt-6">
            <AlertCircle className="h-5 w-5 text-warning-amber" />
            <div className="flex-1">
              <p className="font-medium">Set up payments to get paid</p>
              <p className="text-sm text-muted-foreground">
                Connect your Stripe account to receive milestone payments.
              </p>
            </div>
            <Button asChild>
              <Link href="/contractor/onboarding">
                <CreditCard className="mr-2 h-4 w-4" />
                Connect Stripe
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalEarned)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Milestones
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingMilestones}</div>
          </CardContent>
        </Card>
      </div>

      {/* Stripe Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Payment Status</CardTitle>
            <CardDescription>Your Stripe Connect account</CardDescription>
          </div>
          {hasStripe ? (
            <Badge className="bg-trust-green/10 text-trust-green">
              <CheckCircle className="mr-1 h-3 w-3" />
              Connected
            </Badge>
          ) : (
            <Badge variant="secondary">Not Connected</Badge>
          )}
        </CardHeader>
      </Card>

      {/* Project List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Jobs</CardTitle>
          <CardDescription>
            {totalProjects === 0
              ? "No jobs assigned yet."
              : `You have ${totalProjects} job${totalProjects > 1 ? "s" : ""}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totalProjects === 0 ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <FolderOpen className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Jobs will appear here once clients assign you to projects.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {projects?.map((project) => (
                <Link
                  key={project.id}
                  href={`/contractor/projects/${project.id}`}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div>
                    <h3 className="font-medium">{project.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(project.total_budget)} &middot;{" "}
                      {project.milestones?.length ?? 0} milestones
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {PROJECT_STATUS_LABELS[project.status]}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
