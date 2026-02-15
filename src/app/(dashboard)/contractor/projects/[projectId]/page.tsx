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
  MILESTONE_STATUS_COLORS,
} from "@/lib/constants";
import { projectStatusKey, milestoneStatusKey } from "@/lib/i18n-constants";
import type { ProjectStatus, MilestoneStatus } from "@/lib/types/database";
import { MilestoneActions } from "@/components/milestones/milestone-actions";
import { MilestoneTimeline } from "@/components/milestones/milestone-timeline";
import { ChatPanel } from "@/components/chat/chat-panel";
import { ImageGallery } from "@/components/images/image-gallery";
import { DisputeButton } from "@/components/disputes/dispute-button";
import { StaticLocationMap } from "@/components/map/static-location-map";
import { AlertTriangle, MapPin } from "lucide-react";
import { getTranslations } from "next-intl/server";

type Project = {
  id: string;
  title: string;
  description: string | null;
  total_budget: number;
  status: ProjectStatus;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
};

type Milestone = {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  order_index: number;
  status: MilestoneStatus;
  proof_video_url: string | null;
  funded_at: string | null;
  checked_in_at: string | null;
  released_at: string | null;
};

export default async function ContractorProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const t = await getTranslations();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: projectData } = await supabase
    .from("projects")
    .select("id, title, description, total_budget, status, latitude, longitude, address")
    .eq("id", projectId)
    .single();

  if (!projectData) notFound();
  const project = projectData as unknown as Project;

  const { data: milestonesData } = await supabase
    .from("milestones")
    .select("id, title, description, amount, order_index, status, proof_video_url, funded_at, checked_in_at, released_at")
    .eq("project_id", projectId)
    .order("order_index", { ascending: true });

  const milestones = (milestonesData ?? []) as unknown as Milestone[];

  // Fetch project images
  const { data: imagesData } = await supabase
    .from("project_images")
    .select("id, storage_path, caption, display_order")
    .eq("project_id", projectId)
    .order("display_order", { ascending: true });

  const projectImages = (imagesData ?? []) as {
    id: string;
    storage_path: string;
    caption: string | null;
    display_order: number;
  }[];

  // Fetch dispute info (if disputed)
  let disputeReason: string | null = null;
  if (project.status === "disputed") {
    const { data: disputeData } = await supabase
      .from("disputes")
      .select("reason")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    disputeReason = (disputeData as { reason: string } | null)?.reason ?? null;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  const totalMilestoneAmount = milestones.reduce(
    (sum, m) => sum + m.amount,
    0
  );
  const releasedAmount = milestones
    .filter((m) => m.status === "released")
    .reduce((sum, m) => sum + m.amount, 0);

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
          {t(projectStatusKey(project.status))}
        </Badge>
      </div>

      {/* Project Location */}
      {project.latitude != null && project.longitude != null && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">{t("map.projectLocation")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <StaticLocationMap
              latitude={project.latitude}
              longitude={project.longitude}
              label={project.address ?? undefined}
              className="h-48"
            />
            {project.address && (
              <p className="mt-2 text-xs text-muted-foreground">{project.address}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Disputed Banner */}
      {project.status === "disputed" && (
        <Card className="border-danger-red/30 bg-danger-red/5">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-danger-red" />
            <div>
              <p className="font-medium text-danger-red">{t("disputes.projectDisputed")}</p>
              <p className="text-sm text-muted-foreground">
                {t("disputes.disputedDesc")}
              </p>
              {disputeReason && (
                <p className="mt-2 text-sm">
                  <span className="font-medium">{t("disputes.reason")}:</span> {disputeReason}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("projects.totalBudget")}</CardTitle>
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
              {t("projects.milestoneTotal")}
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
            <CardTitle className="text-sm font-medium">{t("projects.released")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-trust-green">
              {formatCurrency(releasedAmount)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Images */}
      {projectImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("images.projectImages")}</CardTitle>
            <CardDescription>
              {t("images.referenceImages")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageGallery
              images={projectImages}
              supabaseUrl={supabaseUrl}
            />
          </CardContent>
        </Card>
      )}

      {/* Project Timeline */}
      {milestones.length > 0 && (
        <MilestoneTimeline milestones={milestones} />
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("milestones.title")}</CardTitle>
          <CardDescription>
            {t("milestones.contractorDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {milestones.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {t("milestones.noMilestonesClient")}
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
                      {t(milestoneStatusKey(milestone.status))}
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

      {/* Open Dispute */}
      {project.status === "active" && (
        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              <CardTitle>{t("disputes.title")}</CardTitle>
            </div>
            <CardDescription>
              {t("disputes.contractorDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DisputeButton projectId={projectId} />
          </CardContent>
        </Card>
      )}

      {/* Chat */}
      <Card>
        <CardHeader>
          <CardTitle>{t("projects.projectChat")}</CardTitle>
          <CardDescription>
            {t("chat.chatDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChatPanel projectId={projectId} />
        </CardContent>
      </Card>
    </div>
  );
}
