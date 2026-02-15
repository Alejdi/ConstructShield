import { createClient } from "@/lib/supabase/server";
import { ServiceCard } from "@/components/marketplace/service-card";
import { MarketplaceFilterBar } from "@/components/marketplace/marketplace-filter-bar";
import { Package } from "lucide-react";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import type { FilterFieldConfig } from "@/lib/types/filters";
import { getTranslations } from "next-intl/server";
import { serviceCategoryKey } from "@/lib/i18n-constants";

export const metadata = {
  title: "Services - ConstructShield",
};

type ServiceListing = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  starting_price: number;
  created_at: string;
  contractors: {
    business_name: string;
    verified: boolean;
  } | null;
};

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    verified?: string;
    sort?: string;
  }>;
}) {
  const t = await getTranslations();
  const params = await searchParams;
  const supabase = await createClient();

  const filterFields: FilterFieldConfig[] = [
    {
      param: "q",
      label: t("common.search"),
      type: "search",
      placeholder: t("marketplace.searchJobs"),
    },
    {
      param: "category",
      label: t("services.category"),
      type: "select",
      options: SERVICE_CATEGORIES.map((c) => ({
        label: t(serviceCategoryKey(c.value)),
        value: c.value,
      })),
    },
    {
      param: "minPrice",
      label: "Price",
      type: "range",
      rangeMaxParam: "maxPrice",
      rangePlaceholders: ["Min (€)", "Max (€)"],
    },
    {
      param: "verified",
      label: t("contractors.verifiedOnly"),
      type: "toggle",
    },
    {
      param: "sort",
      label: t("marketplace.sortBy"),
      type: "sort",
      options: [
        { label: t("marketplace.newest"), value: "newest" },
        { label: t("services.priceLowToHigh"), value: "price_low" },
        { label: t("services.priceHighToLow"), value: "price_high" },
      ],
    },
  ];

  let query = supabase
    .from("service_listings")
    .select(
      "id, title, description, category, starting_price, created_at, contractors(business_name, verified)"
    )
    .eq("status", "active");

  if (params.q) {
    query = query.ilike("title", `%${params.q}%`);
  }

  if (params.category) {
    query = query.eq("category", params.category);
  }

  if (params.minPrice) {
    query = query.gte("starting_price", Number(params.minPrice) * 100);
  }
  if (params.maxPrice) {
    query = query.lte("starting_price", Number(params.maxPrice) * 100);
  }

  const sortMap: Record<string, { column: string; ascending: boolean }> = {
    newest: { column: "created_at", ascending: false },
    price_low: { column: "starting_price", ascending: true },
    price_high: { column: "starting_price", ascending: false },
  };
  const sortConfig = sortMap[params.sort ?? "newest"] ?? sortMap.newest;
  query = query.order(sortConfig.column, { ascending: sortConfig.ascending });

  const { data } = await query;
  let listings = (data ?? []) as unknown as ServiceListing[];

  // Post-fetch filter for verified (Supabase can't filter on joined columns)
  if (params.verified === "true") {
    listings = listings.filter((l) => l.contractors?.verified === true);
  }

  return (
    <div>
      <div className="mb-8">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
          {t("marketplace.title")}
        </p>
        <h1 className="text-4xl font-bold tracking-tight">{t("services.servicesTitle")}</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          {t("services.browseServices")}
        </p>
      </div>

      <MarketplaceFilterBar fields={filterFields} />

      <p className="mb-4 text-xs text-muted-foreground">
        {t("services.servicesFound", { count: listings.length })}
      </p>

      {listings.length === 0 ? (
        <div className="flex flex-col items-center gap-4 border-t py-16">
          <Package className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            {t("services.noServicesYet")}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {listings.map((listing) => (
            <ServiceCard
              key={listing.id}
              id={listing.id}
              title={listing.title}
              description={listing.description}
              category={listing.category}
              startingPrice={listing.starting_price}
              contractorName={
                listing.contractors?.business_name ?? "Unknown"
              }
              verified={listing.contractors?.verified ?? false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
