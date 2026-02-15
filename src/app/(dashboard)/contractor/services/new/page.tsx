"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ServiceListingForm } from "@/components/marketplace/service-listing-form";
import { createServiceListing } from "@/actions/service-listings";
import { useTranslations } from "next-intl";

export default function NewServiceListingPage() {
  const t = useTranslations();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t("services.addNewService")}</h1>
        <p className="text-muted-foreground">
          {t("services.createServiceDesc")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("services.serviceDetails")}</CardTitle>
          <CardDescription>
            {t("services.serviceDetailsDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ServiceListingForm
            action={createServiceListing}
            submitLabel={t("services.createListing")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
