import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  MapPin,
  ArrowRight,
  Video,
  Star,
} from "lucide-react";
import Link from "next/link";
import { SUBSCRIPTION_TIER_LABELS } from "@/lib/constants";
import type { SubscriptionTier } from "@/lib/types/database";
import { MessageButton } from "@/components/contractors/message-button";
import { StaticLocationMap } from "@/components/map/static-location-map";
import { RatingSummary } from "@/components/reviews/rating-summary";
import { ReviewCard } from "@/components/reviews/review-card";

type ContractorProfile = {
  id: string;
  business_name: string;
  verified: boolean;
  subscription_tier: SubscriptionTier;
  specialties: string[] | null;
  service_area: string | null;
  bio: string | null;
  license_number: string | null;
  hype_video_playback_id: string | null;
  reputation_score: number;
  latitude: number | null;
  longitude: number | null;
};

export default async function ContractorPublicProfilePage({
  params,
}: {
  params: Promise<{ contractorId: string }>;
}) {
  const { contractorId } = await params;
  const supabase = await createClient();

  const { data: contractorData } = await supabase
    .from("contractors")
    .select("id, business_name, verified, subscription_tier, specialties, service_area, bio, license_number, hype_video_playback_id, reputation_score, latitude, longitude")
    .eq("id", contractorId)
    .single();

  if (!contractorData) notFound();

  const contractor = contractorData as unknown as ContractorProfile;

  const { data: profileData } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", contractorId)
    .single();

  const profile = profileData as {
    full_name: string;
    avatar_url: string | null;
  } | null;

  // The user is authenticated (dashboard layout guarantees this)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let isClient = false;
  if (user) {
    const { data: viewerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isClient = (viewerProfile as { role: string } | null)?.role === "client";
  }

  // Fetch rating aggregate
  const { data: ratingData } = await supabase.rpc("get_contractor_rating", {
    p_contractor_id: contractorId,
  });

  const ratingRow = (ratingData as { avg_rating: number; review_count: number }[] | null)?.[0];
  const avgRating = ratingRow?.avg_rating ?? 0;
  const reviewCount = Number(ratingRow?.review_count ?? 0);

  // Fetch individual reviews
  const { data: reviewsData } = await supabase
    .from("reviews")
    .select("id, rating, comment, created_at, client_id, project_id")
    .eq("contractor_id", contractorId)
    .order("created_at", { ascending: false });

  type ReviewRow = {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    client_id: string;
    project_id: string;
  };

  const reviews = (reviewsData ?? []) as unknown as ReviewRow[];

  // Fetch client names and project titles for reviews
  const clientIds = [...new Set(reviews.map((r) => r.client_id))];
  const projectIds = [...new Set(reviews.map((r) => r.project_id))];

  const { data: clientProfiles } = clientIds.length > 0
    ? await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", clientIds)
    : { data: [] };

  const { data: projectTitles } = projectIds.length > 0
    ? await supabase
        .from("projects")
        .select("id, title")
        .in("id", projectIds)
    : { data: [] };

  const clientMap = new Map(
    ((clientProfiles ?? []) as { id: string; full_name: string }[]).map((p) => [p.id, p.full_name])
  );
  const projectMap = new Map(
    ((projectTitles ?? []) as { id: string; title: string }[]).map((p) => [p.id, p.title])
  );

  // Build distribution
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((r) => {
    distribution[r.rating] = (distribution[r.rating] ?? 0) + 1;
  });

  return (
    <div className="mx-auto max-w-3xl">
      {/* Back link */}
      <Link
        href="/contractors"
        className="mb-6 inline-flex items-center gap-1 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
      >
        &larr; Back to Directory
      </Link>

      {/* Profile */}
      <div className="space-y-10">
        {/* Name & Badges */}
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            {contractor.verified && (
              <Badge className="bg-trust-green/10 text-trust-green">
                <ShieldCheck className="me-1 h-3 w-3" />
                Verified
              </Badge>
            )}
            <Badge variant="outline" className="uppercase tracking-widest text-[10px]">
              {SUBSCRIPTION_TIER_LABELS[contractor.subscription_tier]}
            </Badge>
            {contractor.reputation_score > 0 && (
              <Badge variant="outline" className="text-[10px]">
                <Star className="me-1 h-3 w-3 fill-foreground text-foreground" />
                {contractor.reputation_score}/100
              </Badge>
            )}
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            {contractor.business_name}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {profile?.full_name}
          </p>
        </div>

        {/* About */}
        {contractor.bio && (
          <div className="border-t pt-8">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              About
            </p>
            <p className="leading-relaxed text-muted-foreground">
              {contractor.bio}
            </p>
          </div>
        )}

        {/* Details */}
        <div className="grid gap-8 border-t pt-8 sm:grid-cols-2">
          {contractor.service_area && (
            <div>
              <div className="mb-1 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Service Area
                </p>
              </div>
              <p className="font-medium">{contractor.service_area}</p>
            </div>
          )}
          {contractor.license_number && (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                License
              </p>
              <p className="font-medium">{contractor.license_number}</p>
            </div>
          )}
        </div>

        {/* Location Map */}
        {contractor.latitude != null && contractor.longitude != null && (
          <div className="overflow-hidden border-t pt-8">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Location
            </p>
            <StaticLocationMap
              latitude={contractor.latitude}
              longitude={contractor.longitude}
              label={contractor.service_area ?? undefined}
              className="h-48"
            />
          </div>
        )}

        {/* Specialties */}
        {contractor.specialties && contractor.specialties.length > 0 && (
          <div className="border-t pt-8">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Specialties
            </p>
            <div className="flex flex-wrap gap-2">
              {contractor.specialties.map((s) => (
                <span
                  key={s}
                  className="rounded-full border px-4 py-1.5 text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Video Showcase */}
        <div className="border-t pt-8">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Project Showcase
          </p>
          {contractor.hype_video_playback_id ? (
            <div className="aspect-video overflow-hidden bg-muted">
              <video
                src={`https://stream.mux.com/${contractor.hype_video_playback_id}.m3u8`}
                controls
                className="h-full w-full"
                poster={`https://image.mux.com/${contractor.hype_video_playback_id}/thumbnail.webp`}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 border border-dashed p-12 text-center">
              <Video className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Video showcase coming soon
              </p>
            </div>
          )}
        </div>

        {/* Reviews */}
        <div className="border-t pt-8">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Reviews
          </p>
          <RatingSummary
            avgRating={avgRating}
            reviewCount={reviewCount}
            distribution={distribution}
          />
          {reviews.length > 0 && (
            <div className="mt-6 space-y-4">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  rating={review.rating}
                  comment={review.comment}
                  clientName={clientMap.get(review.client_id) ?? "Client"}
                  projectTitle={projectMap.get(review.project_id) ?? "Project"}
                  createdAt={review.created_at}
                />
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="border-t pt-8 text-center">
          <p className="mb-6 text-muted-foreground">
            Start a project with {contractor.business_name} — protected by
            ConstructShield escrow
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            {isClient && (
              <MessageButton contractorId={contractor.id} />
            )}
            <Link
              href={`/client/projects/new?contractor=${contractor.id}`}
              className="group inline-flex items-center gap-3 border border-foreground px-8 py-4 text-xs font-medium uppercase tracking-[0.2em] transition-colors hover:bg-foreground hover:text-background"
            >
              Start a Project
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
