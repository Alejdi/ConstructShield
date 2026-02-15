import { createClient } from "@/lib/supabase/server";
import { JobCard } from "@/components/marketplace/job-card";
import { MarketplaceFilterBar } from "@/components/marketplace/marketplace-filter-bar";
import { NearbyJobBoard } from "@/components/marketplace/nearby-job-board";
import { Briefcase } from "lucide-react";
import Link from "next/link";
import type { FilterFieldConfig } from "@/lib/types/filters";
import { getTranslations } from "next-intl/server";

export const metadata = {
  title: "Job Board - ConstructShield",
};

type JobProject = {
  id: string;
  title: string;
  description: string | null;
  total_budget: number;
  address: string | null;
  created_at: string;
  client_id: string;
  profiles: { full_name: string } | null;
  bids: { count: number }[];
  project_images: { storage_path: string }[];
};

export default async function JobBoardPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    minBudget?: string;
    maxBudget?: string;
    sort?: string;
  }>;
}) {
  const t = await getTranslations();
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  const filterFields: FilterFieldConfig[] = [
    {
      param: "q",
      label: t("common.search"),
      type: "search",
      placeholder: t("marketplace.searchJobs"),
    },
    {
      param: "minBudget",
      label: t("marketplace.budget"),
      type: "range",
      rangeMaxParam: "maxBudget",
      rangePlaceholders: [t("marketplace.minBudget"), t("marketplace.maxBudget")],
    },
    {
      param: "sort",
      label: t("marketplace.sortBy"),
      type: "sort",
      options: [
        { label: t("marketplace.newest"), value: "newest" },
        { label: t("marketplace.oldest"), value: "oldest" },
        { label: t("marketplace.highestBudget"), value: "budget_high" },
        { label: t("marketplace.lowestBudget"), value: "budget_low" },
      ],
    },
  ];

  let query = supabase
    .from("projects")
    .select(
      "id, title, description, total_budget, address, created_at, client_id, profiles!projects_client_id_fkey(full_name), bids(count), project_images(storage_path)"
    )
    .eq("status", "bidding")
    .eq("is_public", true);

  if (params.q) {
    query = query.ilike("title", `%${params.q}%`);
  }

  if (params.minBudget) {
    query = query.gte("total_budget", Number(params.minBudget) * 100);
  }
  if (params.maxBudget) {
    query = query.lte("total_budget", Number(params.maxBudget) * 100);
  }

  const sortMap: Record<string, { column: string; ascending: boolean }> = {
    newest: { column: "created_at", ascending: false },
    oldest: { column: "created_at", ascending: true },
    budget_high: { column: "total_budget", ascending: false },
    budget_low: { column: "total_budget", ascending: true },
  };
  const sortConfig = sortMap[params.sort ?? "newest"] ?? sortMap.newest;
  query = query.order(sortConfig.column, { ascending: sortConfig.ascending });

  const { data } = await query;
  const jobs = (data ?? []) as unknown as JobProject[];

  return (
    <div>
      <div className="mb-8">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
          {t("marketplace.title")}
        </p>
        <h1 className="text-4xl font-bold tracking-tight">{t("marketplace.jobBoard")}</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          {t("marketplace.browseJobs")}
        </p>
      </div>

      <MarketplaceFilterBar fields={filterFields} />

      <NearbyJobBoard initialJobCount={jobs.length}>
        {jobs.length === 0 ? (
          <div className="flex flex-col items-center gap-4 border-t py-16">
            <Briefcase className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              {t("marketplace.noJobsYet")}
            </p>
            {user && (
              <Link
                href="/client/projects/new"
                className="inline-flex items-center gap-2 border border-foreground px-5 py-2.5 text-xs font-medium uppercase tracking-[0.15em] transition-colors hover:bg-foreground hover:text-background"
              >
                {t("marketplace.postJob")}
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                id={job.id}
                title={job.title}
                description={job.description}
                totalBudget={job.total_budget}
                address={job.address}
                createdAt={job.created_at}
                clientName={job.profiles?.full_name ?? "Anonymous"}
                bidCount={job.bids?.[0]?.count ?? 0}
                isOwner={user?.id === job.client_id}
                thumbnailUrl={
                  job.project_images?.[0]
                    ? `${supabaseUrl}/storage/v1/object/public/project-images/${job.project_images[0].storage_path}`
                    : null
                }
              />
            ))}
          </div>
        )}
      </NearbyJobBoard>
    </div>
  );
}
