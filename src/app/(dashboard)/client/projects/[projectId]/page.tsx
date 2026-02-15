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
import { MILESTONE_STATUS_COLORS } from "@/lib/constants";
import { projectStatusKey, milestoneStatusKey } from "@/lib/i18n-constants";
import type { ProjectStatus, MilestoneStatus } from "@/lib/types/database";
import { MilestoneActions } from "@/components/milestones/milestone-actions";
import { DeleteMilestoneButton } from "@/components/milestones/delete-milestone-button";
import { AddMilestoneForm } from "@/components/milestones/add-milestone-form";
import { ChatPanel } from "@/components/chat/chat-panel";
import { MilestoneTimeline } from "@/components/milestones/milestone-timeline";
import { ReviewForm } from "@/components/reviews/review-form";
import { StarRating } from "@/components/reviews/review-card";
import { CompleteProjectButton } from "@/components/reviews/complete-project-button";
import { ImageGallery } from "@/components/images/image-gallery";
import { ImageUploader } from "@/components/images/image-uploader";
import { ImageIcon, Gavel, AlertTriangle, Pencil, MapPin } from "lucide-react";
import { StaticLocationMap } from "@/components/map/static-location-map";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PublishProjectButton } from "@/components/projects/publish-project-button";
import { BidCard } from "@/components/marketplace/bid-card";
import { DisputeButton } from "@/components/disputes/dispute-button";
import type { BidStatus } from "@/lib/types/database";
import { getTranslations } from "next-intl/server";

type Project = {
  id: string;
  title: string;
  description: string | null;
  total_budget: number;
  status: ProjectStatus;
  contractor_id: string | null;
  has_funded_deposit: boolean;
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

export default async function ClientProjectDetailPage({
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
    .select("id, title, description, total_budget, status, contractor_id, has_funded_deposit, latitude, longitude, address")
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

  // Fetch existing review
  const { data: reviewData } = await supabase
    .from("reviews")
    .select("id, rating, comment, created_at")
    .eq("project_id", projectId)
    .single();

  const review = reviewData as {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
  } | null;

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

  // Fetch bids for bidding projects
  type BidRow = {
    id: string;
    amount: number;
    message: string | null;
    status: BidStatus;
    created_at: string;
    contractor_id: string;
    profiles: { full_name: string } | null;
    contractors: {
      business_name: string;
      verified: boolean;
      specialties: string[] | null;
    } | null;
  };

  let bids: BidRow[] = [];
  if (project.status === "bidding") {
    const { data: bidsData } = await supabase
      .from("bids")
      .select(
        "id, amount, message, status, created_at, contractor_id, profiles(full_name), contractors(business_name, verified, specialties)"
      )
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    bids = (bidsData ?? []) as unknown as BidRow[];
  }

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
        <div className="flex items-center gap-2">
          {(project.status === "draft" || project.status === "bidding") && (
            <Link href={`/client/projects/${projectId}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="me-2 h-4 w-4" />
                {t("projects.editProject")}
              </Button>
            </Link>
          )}
          <Badge variant="secondary">
            {t(projectStatusKey(project.status))}
          </Badge>
        </div>
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

      {/* Draft Banner */}
      {project.status === "draft" && (
        <Card className="border-dashed border-warning-amber/50 bg-warning-amber/5">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium">{t("projects.draftTitle")}</p>
              <p className="text-sm text-muted-foreground">
                {t("projects.draftDesc")}
              </p>
            </div>
            <PublishProjectButton projectId={projectId} />
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

      {/* Incoming Bids */}
      {project.status === "bidding" && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Gavel className="h-5 w-5 text-muted-foreground" />
              <CardTitle>{t("bids.incomingBids", { count: bids.length })}</CardTitle>
            </div>
            <CardDescription>
              {bids.length === 0
                ? t("bids.noBidsYetDesc")
                : t("bids.reviewBidsDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bids.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {t("bids.noBidsYetDesc")}
              </p>
            ) : (
              <div className="space-y-2">
                {bids.map((bid) => (
                  <BidCard
                    key={bid.id}
                    id={bid.id}
                    amount={bid.amount}
                    message={bid.message}
                    status={bid.status}
                    createdAt={bid.created_at}
                    contractorName={bid.profiles?.full_name ?? "Unknown"}
                    businessName={bid.contractors?.business_name ?? "Unknown"}
                    verified={bid.contractors?.verified ?? false}
                    specialties={bid.contractors?.specialties ?? null}
                    isProjectOwner
                  />
                ))}
              </div>
            )}
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
      <Card className={projectImages.length === 0 ? "border-dashed" : ""}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
            <CardTitle>{t("images.projectImages")}</CardTitle>
          </div>
          <CardDescription>
            {t("images.uploadDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {projectImages.length > 0 && (
            <ImageGallery
              images={projectImages}
              supabaseUrl={supabaseUrl}
              canDelete
            />
          )}
          <ImageUploader
            projectId={projectId}
            existingCount={projectImages.length}
          />
        </CardContent>
      </Card>

      {/* Project Timeline */}
      {milestones.length > 0 && (
        <MilestoneTimeline milestones={milestones} />
      )}

      {/* Milestones */}
      <Card>
        <CardHeader>
          <CardTitle>{t("milestones.title")}</CardTitle>
          <CardDescription>
            {t("milestones.clientDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {milestones.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {t("milestones.noMilestonesYet")}
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
                <div className="flex items-center gap-1">
                  <MilestoneActions
                    milestoneId={milestone.id}
                    status={milestone.status}
                    role="client"
                    proofVideoUrl={milestone.proof_video_url}
                  />
                  {milestone.status === "waiting_for_funds" && (
                    <DeleteMilestoneButton
                      milestoneId={milestone.id}
                      milestoneTitle={milestone.title}
                    />
                  )}
                </div>
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
            <CardTitle>{t("projects.projectChat")}</CardTitle>
            <CardDescription>
              {t("projects.chatDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChatPanel projectId={projectId} />
          </CardContent>
        </Card>
      )}

      {/* Open Dispute */}
      {project.status === "active" && project.contractor_id && (
        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              <CardTitle>{t("disputes.title")}</CardTitle>
            </div>
            <CardDescription>
              {t("disputes.clientDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DisputeButton projectId={projectId} />
          </CardContent>
        </Card>
      )}

      {/* Complete Project */}
      {project.status === "active" &&
        milestones.length > 0 &&
        milestones.every((m) => m.status === "released") && (
          <Card>
            <CardHeader>
              <CardTitle>{t("projects.projectComplete")}</CardTitle>
              <CardDescription>
                {t("projects.projectCompleteDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompleteProjectButton projectId={projectId} />
            </CardContent>
          </Card>
        )}

      {/* Review */}
      {project.status === "completed" && project.contractor_id && (
        <Card>
          <CardHeader>
            <CardTitle>{t("reviews.title")}</CardTitle>
            <CardDescription>
              {review
                ? t("reviews.yourReview")
                : t("reviews.rateExperience")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {review ? (
              <div className="space-y-2">
                <StarRating rating={review.rating} />
                {review.comment && (
                  <p className="text-sm text-muted-foreground">
                    {review.comment}
                  </p>
                )}
              </div>
            ) : (
              <ReviewForm
                projectId={projectId}
                contractorId={project.contractor_id}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
