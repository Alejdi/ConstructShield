import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import {
  PROJECT_STATUS_LABELS,
  MILESTONE_STATUS_LABELS,
  MILESTONE_STATUS_COLORS,
} from "@/lib/constants";
import type { ProjectStatus, MilestoneStatus } from "@/lib/types/database";
import { MilestoneActions } from "@/components/milestones/milestone-actions";
import { AddMilestoneForm } from "@/components/milestones/add-milestone-form";
import { ChatPanel } from "@/components/chat/chat-panel";

type Project = {
  id: string;
  title: string;
  description: string | null;
  total_budget: number;
  status: ProjectStatus;
  contractor_id: string | null;
  has_funded_deposit: boolean;
};

type Milestone = {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  order_index: number;
  status: MilestoneStatus;
  proof_video_url: string | null;
};

export default async function ClientProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: projectData } = await supabase
    .from("projects")
    .select("id, title, description, total_budget, status, contractor_id, has_funded_deposit")
    .eq("id", projectId)
    .single();

  if (!projectData) notFound();
  const project = projectData as unknown as Project;

  const { data: milestonesData } = await supabase
    .from("milestones")
    .select("id, title, description, amount, order_index, status, proof_video_url")
    .eq("project_id", projectId)
    .order("order_index", { ascending: true });

  const milestones = (milestonesData ?? []) as unknown as Milestone[];

  const totalMilestoneAmount = milestones.reduce(
    (sum, m) => sum + m.amount,
    0
  );
  const releasedAmount = milestones
    .filter((m) => m.status === "released")
    .reduce((sum, m) => sum + m.amount, 0);

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{project.title}</h1>
          {project.description && (
            <p className="mt-1 text-muted-foreground">
              {project.description}
            </p>
          )}
        </div>
        <Badge variant="secondary">
          {PROJECT_STATUS_LABELS[project.status]}
        </Badge>
      </div>

      {/* Budget Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(project.total_budget)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Milestone Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalMilestoneAmount)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Released</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-trust-green">
              {formatCurrency(releasedAmount)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      {milestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Milestone Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-1">
              {milestones.map((m) => (
                <div
                  key={m.id}
                  className="flex-1 rounded-full h-3"
                  style={{
                    backgroundColor:
                      m.status === "released"
                        ? "#16a34a"
                        : m.status === "verification_pending"
                          ? "#3b82f6"
                          : m.status === "work_in_progress"
                            ? "#f59e0b"
                            : m.status === "funded"
                              ? "#dbeafe"
                              : "#e5e7eb",
                  }}
                  title={`${m.title}: ${MILESTONE_STATUS_LABELS[m.status]}`}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>
                {milestones.filter((m) => m.status === "released").length} of{" "}
                {milestones.length} completed
              </span>
              <span>
                {Math.round((releasedAmount / (totalMilestoneAmount || 1)) * 100)}%
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Milestones */}
      <Card>
        <CardHeader>
          <CardTitle>Milestones</CardTitle>
          <CardDescription>
            Fund milestones to hold money in escrow, then release when work is
            verified
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {milestones.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No milestones yet. Add your first one below.
            </p>
          ) : (
            milestones.map((milestone) => (
              <div
                key={milestone.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{milestone.title}</h3>
                    <Badge
                      className={MILESTONE_STATUS_COLORS[milestone.status]}
                    >
                      {MILESTONE_STATUS_LABELS[milestone.status]}
                    </Badge>
                  </div>
                  {milestone.description && (
                    <p className="text-sm text-muted-foreground">
                      {milestone.description}
                    </p>
                  )}
                  <p className="text-sm font-medium">
                    {formatCurrency(milestone.amount)}
                  </p>
                </div>
                <MilestoneActions
                  milestoneId={milestone.id}
                  status={milestone.status}
                  role="client"
                  proofVideoUrl={milestone.proof_video_url}
                />
              </div>
            ))
          )}

          <Separator />

          <AddMilestoneForm
            projectId={projectId}
            nextOrderIndex={milestones.length}
          />
        </CardContent>
      </Card>

      {/* Chat */}
      {project.contractor_id && (
        <Card>
          <CardHeader>
            <CardTitle>Project Chat</CardTitle>
            <CardDescription>
              Communicate with your contractor — all payments should stay on
              ConstructShield
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChatPanel projectId={projectId} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
