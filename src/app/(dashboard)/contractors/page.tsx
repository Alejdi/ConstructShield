import { createClient } from "@/lib/supabase/server";
import type { SubscriptionTier } from "@/lib/types/database";
import { ContractorDirectory } from "@/components/contractors/contractor-directory";
import { getTranslations } from "next-intl/server";

type ContractorListing = {
  id: string;
  business_name: string;
  verified: boolean;
  subscription_tier: SubscriptionTier;
  specialties: string[] | null;
  service_area: string | null;
  bio: string | null;
  reputation_score: number;
  profiles: { full_name: string; avatar_url: string | null };
};

export const metadata = {
  title: "Find Contractors - ConstructShield",
  description: "Browse verified construction contractors",
};

export default async function ContractorsDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    specialty?: string;
    verified?: string;
    sort?: string;
  }>;
}) {
  const t = await getTranslations();
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("contractors")
    .select(
      "id, business_name, verified, subscription_tier, specialties, service_area, bio, reputation_score, latitude, longitude, profiles(full_name, avatar_url)"
    );

  if (params.q) {
    query = query.ilike("business_name", `%${params.q}%`);
  }

  if (params.verified === "true") {
    query = query.eq("verified", true);
  }

  if (params.specialty) {
    query = query.contains("specialties", [params.specialty]);
  }

  if (params.sort === "newest") {
    query = query.order("created_at", { ascending: false });
  } else if (params.sort === "reputation") {
    query = query.order("reputation_score", { ascending: false });
  } else {
    query = query.order("verified", { ascending: false });
  }

  const { data } = await query;
  const contractors = (data ?? []) as unknown as ContractorListing[];

  return (
    <div>
      <div className="mb-8">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
          {t("contractors.directory")}
        </p>
        <h1 className="text-4xl font-bold tracking-tight">
          {t("contractors.findContractors")}
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          {t("contractors.browseDesc")}
        </p>
      </div>

      <ContractorDirectory
        initialContractors={contractors}
        filters={params}
      />
    </div>
  );
}
