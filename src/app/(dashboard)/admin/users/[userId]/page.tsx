import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { subscriptionTierKey, projectStatusKey } from "@/lib/i18n-constants";
import Link from "next/link";
import { VerifyButton } from "@/components/admin/verify-button";
import type { ProjectStatus, SubscriptionTier } from "@/lib/types/database";
import { getTranslations } from "next-intl/server";

type ProfileRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
};

type ContractorRow = {
  id: string;
  business_name: string | null;
  verified: boolean;
  subscription_tier: SubscriptionTier | null;
  bio: string | null;
};

type ReviewRow = {
  rating: number;
};

type ProjectRow = {
  id: string;
  title: string;
  total_budget: number;
  status: ProjectStatus;
};

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const t = await getTranslations();
  const { userId } = await params;
  const admin = getSupabaseAdmin();

  const { data: profileData } = await admin
    .from("profiles")
    .select("id, full_name, avatar_url, role, created_at")
    .eq("id", userId)
    .single();

  const profile = profileData as ProfileRow | null;
  if (!profile) notFound();

  const isContractor = profile.role === "contractor";

  // Fetch contractor-specific data and projects in parallel
  const [contractorResult, projectsResult, reviewsResult] = await Promise.all([
    isContractor
      ? admin
          .from("contractors")
          .select("id, business_name, verified, subscription_tier, bio")
          .eq("id", userId)
          .single()
      : Promise.resolve({ data: null }),
    admin
      .from("projects")
      .select("id, title, total_budget, status")
      .or(`client_id.eq.${userId},contractor_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(20),
    isContractor
      ? admin.from("reviews").select("rating").eq("contractor_id", userId)
      : Promise.resolve({ data: null }),
  ]);

  const contractor = contractorResult.data as ContractorRow | null;
  const projects = (projectsResult.data ?? []) as ProjectRow[];
  const reviews = (reviewsResult.data ?? []) as ReviewRow[];
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

  return (
    <div className="space-y-8">
      <Link
        href="/admin/users"
        className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground"
      >
        &larr; {t("admin.backToUsers")}
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center border bg-muted text-xl font-bold uppercase">
            {profile.full_name?.charAt(0) ?? "?"}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {profile.full_name ?? t("admin.unnamedUser")}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge
                variant={
                  profile.role === "admin"
                    ? "default"
                    : profile.role === "contractor"
                      ? "secondary"
                      : "outline"
                }
              >
                {profile.role}
              </Badge>
              <span>{t("admin.joined", { date: formatDate(profile.created_at) })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contractor Details */}
      {contractor && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold">{t("admin.contractorDetails")}</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1 border-t pt-4">
              <p className="text-lg font-bold">
                {contractor.business_name ?? "—"}
              </p>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {t("contractor.businessName")}
              </p>
            </div>
            <div className="space-y-1 border-t pt-4">
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold">
                  {contractor.verified ? t("contractor.verified") : t("admin.notVerified")}
                </p>
                <VerifyButton
                  contractorId={contractor.id}
                  verified={contractor.verified}
                />
              </div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {t("admin.verification")}
              </p>
            </div>
            <div className="space-y-1 border-t pt-4">
              <p className="text-lg font-bold">
                {contractor.subscription_tier
                  ? t(subscriptionTierKey(contractor.subscription_tier))
                  : t("common.none")}
              </p>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {t("nav.subscription")}
              </p>
            </div>
            <div className="space-y-1 border-t pt-4">
              <p className="text-lg font-bold">
                {avgRating !== null
                  ? `${avgRating.toFixed(1)} / 5`
                  : t("admin.noReviews")}
              </p>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Rating ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
              </p>
            </div>
          </div>
          {contractor.bio && (
            <p className="text-sm text-muted-foreground">{contractor.bio}</p>
          )}
        </div>
      )}

      {/* Projects */}
      <div>
        <h2 className="mb-4 text-lg font-bold">
          {t("admin.projectsCount", { count: projects.length })}
        </h2>
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("admin.noProjectsYet")}</p>
        ) : (
          <div className="space-y-2">
            {projects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between border p-4"
              >
                <div>
                  <h3 className="font-medium">{project.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(project.total_budget)}
                  </p>
                </div>
                <Badge variant="secondary">
                  {t(projectStatusKey(project.status))}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
