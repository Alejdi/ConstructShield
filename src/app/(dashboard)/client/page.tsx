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
import { FolderOpen, PlusCircle, DollarSign, Clock } from "lucide-react";
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
  title: "Client Dashboard - ConstructShield",
};

export default async function ClientDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase
    .from("projects")
    .select("id, title, total_budget, status, milestones(id, status, amount)")
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Client Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your construction projects
          </p>
        </div>
        <Button asChild>
          <Link href="/client/projects/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Projects
            </CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalBudget)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Active Milestones
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMilestones}</div>
          </CardContent>
        </Card>
      </div>

      {/* Project List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Projects</CardTitle>
          <CardDescription>
            {totalProjects === 0
              ? "You haven't created any projects yet."
              : `You have ${totalProjects} project${totalProjects > 1 ? "s" : ""}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totalProjects === 0 ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <FolderOpen className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Create your first project to get started
              </p>
              <Button asChild>
                <Link href="/client/projects/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Project
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {projects?.map((project) => (
                <Link
                  key={project.id}
                  href={`/client/projects/${project.id}`}
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
