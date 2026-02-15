"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { serviceCategoryKey } from "@/lib/i18n-constants";
import { LocationPicker } from "@/components/location/location-picker";
import type { ServiceListingState } from "@/actions/service-listings";

interface ServiceListingFormProps {
  action: (
    prevState: ServiceListingState,
    formData: FormData
  ) => Promise<ServiceListingState>;
  initialData?: {
    title: string;
    description: string | null;
    category: string;
    startingPrice: number;
  };
  submitLabel: string;
}

const initialState: ServiceListingState = { error: null };

export function ServiceListingForm({
  action,
  initialData,
  submitLabel,
}: ServiceListingFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const t = useTranslations();

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="bg-danger-red/10 p-3 text-sm text-danger-red">
          {state.error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">{t("services.serviceTitle")}</Label>
        <Input
          id="title"
          name="title"
          placeholder={t("services.serviceTitlePlaceholder")}
          defaultValue={initialData?.title}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t("services.serviceDescription")}</Label>
        <Textarea
          id="description"
          name="description"
          placeholder={t("services.serviceDescPlaceholder")}
          rows={4}
          defaultValue={initialData?.description ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">{t("services.category")}</Label>
        <select
          id="category"
          name="category"
          defaultValue={initialData?.category ?? ""}
          required
          className="flex h-10 w-full border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="" disabled>
            {t("services.selectCategory")}
          </option>
          {SERVICE_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {t(serviceCategoryKey(cat.value))}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="startingPrice">{t("services.startingPrice")}</Label>
        <Input
          id="startingPrice"
          name="startingPrice"
          type="number"
          step="0.01"
          min="1"
          placeholder={t("services.pricePlaceholder")}
          defaultValue={
            initialData ? (initialData.startingPrice / 100).toString() : ""
          }
          required
        />
      </div>

      <LocationPicker showAddressField required />

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? t("services.saving") : submitLabel}
      </Button>
    </form>
  );
}
