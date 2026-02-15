import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { BidForm } from "@/components/marketplace/bid-form";
import { BidCard } from "@/components/marketplace/bid-card";
import { MapPin, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { BidStatus } from "@/lib/types/database";
import { StaticLocationMap } from "@/components/map/static-location-map";
import { getTranslations } from "next-intl/server";

type ProjectDetail = {
  id: string;
  title: string;
  description: string | null;
  total_budget: number;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  client_id: string;
  status: string;
  profiles: { full_name: string } | null;
};

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

export default async function JobDetailPage({
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

  // Fetch project
  const { data: projectData } = await supabase
    .from("projects")
    .select(
      "id, title, description, total_budget, address, latitude, longitude, created_at, client_id, status, profiles!projects_client_id_fkey(full_name)"
    )
    .eq("id", projectId)
    .single();

  const project = projectData as unknown as ProjectDetail | null;
  if (!project) redirect("/marketplace/jobs");

  const isOwner = user.id === project.client_id;

  // Fetch profile role
  const { data: profileData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = (profileData as { role: string } | null)?.role;

  // Fetch bids
  const { data: bidsData } = await supabase
    .from("bids")
    .select(
      "id, amount, message, status, created_at, contractor_id, profiles(full_name), contractors(business_name, verified, specialties)"
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  const bids = (bidsData ?? []) as unknown as BidRow[];

  // Check if current user already bid
  const existingBid = bids.find((b) => b.contractor_id === user.id);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/marketplace/jobs"
        className="mb-6 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        {t("marketplace.backToJobBoard")}
      </Link>

      {/* Project Details */}
      <div className="border p-6">
        <p className="mb-1 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {isOwner ? t("marketplace.yourPost") : t("marketplace.jobDetails")}
        </p>
        <h1 className="text-2xl font-bold">{project.title}</h1>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="text-sm font-medium text-foreground">
            {t("marketplace.budget")}: {formatCurrency(project.total_budget)}
          </span>
          {project.address && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {project.address}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {t("marketplace.posted")} {formatRelativeTime(project.created_at)}
          </span>
        </div>

        <p className="mt-1 text-xs text-muted-foreground">
          {t("marketplace.by")} {project.profiles?.full_name ?? t("common.anonymous")}
        </p>

        {project.description && (
          <p className="mt-4 whitespace-pre-wrap text-sm text-muted-foreground">
            {project.description}
          </p>
        )}
      </div>

      {/* Project Location Map */}
      {project.latitude != null && project.longitude != null && (
        <div className="mt-6">
          <StaticLocationMap
            latitude={project.latitude}
            longitude={project.longitude}
            label={project.address ?? undefined}
            className="h-48"
          />
        </div>
      )}

      {/* Contractor: Bid Form */}
      {role === "contractor" && project.status === "bidding" && !existingBid && (
        <div className="mt-6 border p-6">
          <h2 className="mb-4 text-lg font-bold">{t("bids.submitYourBid")}</h2>
          <BidForm
            projectId={projectId}
            suggestedBudget={project.total_budget}
          />
        </div>
      )}

      {/* Contractor: Existing Bid */}
      {existingBid && (
        <div className="mt-6 border p-6">
          <h2 className="mb-4 text-lg font-bold">{t("bids.yourBidTitle")}</h2>
          <BidCard
            id={existingBid.id}
            amount={existingBid.amount}
            message={existingBid.message}
            status={existingBid.status}
            createdAt={existingBid.created_at}
            contractorName={
              existingBid.profiles?.full_name ?? "You"
            }
            businessName={
              existingBid.contractors?.business_name ?? "Your Business"
            }
            verified={existingBid.contractors?.verified ?? false}
            specialties={existingBid.contractors?.specialties ?? null}
            isProjectOwner={false}
          />
        </div>
      )}

      {/* Client: Bids List */}
      {isOwner && (
        <div className="mt-6">
          <h2 className="mb-4 text-lg font-bold">
            {t("marketplace.bidsCount", { count: bids.length })}
          </h2>
          {bids.length === 0 ? (
            <div className="border py-8 text-center">
              <p className="text-sm text-muted-foreground">
                {t("marketplace.noBidsYet")}
              </p>
            </div>
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
                  businessName={
                    bid.contractors?.business_name ?? "Unknown"
                  }
                  verified={bid.contractors?.verified ?? false}
                  specialties={bid.contractors?.specialties ?? null}
                  isProjectOwner={isOwner}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
