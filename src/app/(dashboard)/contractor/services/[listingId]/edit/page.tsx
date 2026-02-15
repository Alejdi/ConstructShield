"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ServiceListingForm } from "@/components/marketplace/service-listing-form";
import { updateServiceListing } from "@/actions/service-listings";
import type { ServiceListingStatus } from "@/lib/types/database";

type ServiceListing = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  starting_price: number;
  status: ServiceListingStatus;
};

export default function EditServiceListingPage() {
  const t = useTranslations();
  const params = useParams<{ listingId: string }>();
  const [listing, setListing] = useState<ServiceListing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data } = await supabase
        .from("service_listings")
        .select("id, title, description, category, starting_price, status")
        .eq("id", params.listingId)
        .single();
      setListing(data as ServiceListing | null);
      setLoading(false);
    }
    load();
  }, [params.listingId]);

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        {t("common.loading")}
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        {t("services.notFound")}
      </div>
    );
  }

  const boundAction = updateServiceListing.bind(null, listing.id);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t("services.editService")}</h1>
        <p className="text-muted-foreground">
          {t("services.editServiceDesc")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("services.serviceDetails")}</CardTitle>
          <CardDescription>
            {t("services.editServiceDetailsDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ServiceListingForm
            action={boundAction}
            initialData={{
              title: listing.title,
              description: listing.description,
              category: listing.category,
              startingPrice: listing.starting_price,
            }}
            submitLabel={t("services.saveChanges")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
