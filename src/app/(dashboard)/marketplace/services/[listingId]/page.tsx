import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { MessageButton } from "@/components/contractors/message-button";
import { ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { serviceCategoryKey } from "@/lib/i18n-constants";

type ServiceDetail = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  starting_price: number;
  contractor_id: string;
  contractors: {
    business_name: string;
    verified: boolean;
    specialties: string[] | null;
    bio: string | null;
    service_area: string | null;
  } | null;
};

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ listingId: string }>;
}) {
  const { listingId } = await params;
  const t = await getTranslations();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: listingData } = await supabase
    .from("service_listings")
    .select(
      "id, title, description, category, starting_price, contractor_id, contractors(business_name, verified, specialties, bio, service_area)"
    )
    .eq("id", listingId)
    .single();

  const listing = listingData as unknown as ServiceDetail | null;
  if (!listing) redirect("/marketplace/services");

  // Check if current user is a client
  let isClient = false;
  if (user) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isClient = (profileData as { role: string } | null)?.role === "client";
  }

  const contractor = listing.contractors;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/marketplace/services"
        className="mb-6 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        {t("services.backToServices")}
      </Link>

      {/* Listing Details */}
      <div className="border p-6">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
            {t(serviceCategoryKey(listing.category))}
          </Badge>
        </div>

        <h1 className="mt-3 text-2xl font-bold">{listing.title}</h1>

        <p className="mt-2 text-lg font-medium">
          {t("services.startingAt", { price: formatCurrency(listing.starting_price) })}
        </p>

        {listing.description && (
          <p className="mt-4 whitespace-pre-wrap text-sm text-muted-foreground">
            {listing.description}
          </p>
        )}
      </div>

      {/* Contractor Info */}
      {contractor && (
        <div className="mt-4 border p-6">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {t("services.offeredBy")}
          </p>
          <div className="flex items-center gap-2">
            <Link
              href={`/contractors/${listing.contractor_id}`}
              className="text-lg font-bold hover:underline"
            >
              {contractor.business_name}
            </Link>
            {contractor.verified && (
              <CheckCircle className="h-4 w-4 text-trust-green" />
            )}
          </div>

          {contractor.bio && (
            <p className="mt-2 text-sm text-muted-foreground">
              {contractor.bio}
            </p>
          )}

          {contractor.specialties && contractor.specialties.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {contractor.specialties.map((s) => (
                <span
                  key={s}
                  className="bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          {contractor.service_area && (
            <p className="mt-2 text-xs text-muted-foreground">
              {t("contractor.serviceArea")}: {contractor.service_area}
            </p>
          )}
        </div>
      )}

      {/* Client CTAs */}
      {isClient && (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <MessageButton contractorId={listing.contractor_id} />
          <Link
            href={`/client/projects/new?contractor=${listing.contractor_id}&title=${encodeURIComponent(listing.title)}&budget=${listing.starting_price / 100}`}
            className="inline-flex items-center justify-center border border-foreground px-6 py-3 text-xs font-medium uppercase tracking-[0.15em] transition-colors hover:bg-foreground hover:text-background"
          >
            {t("services.startProject")}
          </Link>
        </div>
      )}
    </div>
  );
}
