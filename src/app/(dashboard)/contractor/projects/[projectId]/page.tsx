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
import { formatCurrency } from "@/lib/utils";
import {
  PROJECT_STATUS_LABELS,
  MILESTONE_STATUS_LABELS,
  MILESTONE_STATUS_COLORS,
} from "@/lib/constants";
import type { ProjectStatus, MilestoneStatus } from "@/lib/types/database";
import { MilestoneActions } from "@/components/milestones/milestone-actions";
import { ChatPanel } from "@/components/chat/chat-panel";

type Project = {
  id: string;
  title: string;
  description: string | null;
  total_budget: number;
  status: ProjectStatus;
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

export default async function ContractorProjectDetailPage({
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
    .select("id, title, description, total_budget, status")
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

  return (
    <div className="space-y-6">
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

      <Card>
        <CardHeader>
          <CardTitle>Milestones</CardTitle>
          <CardDescription>
            Start work on funded milestones and upload video proof when done
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {milestones.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              The client hasn&apos;t added milestones yet.
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
                  role="contractor"
                  proofVideoUrl={milestone.proof_video_url}
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Chat */}
      <Card>
        <CardHeader>
          <CardTitle>Project Chat</CardTitle>
          <CardDescription>
            Communicate with the client — all payments should stay on
            ConstructShield
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChatPanel projectId={projectId} />
        </CardContent>
      </Card>
    </div>
  );
}
