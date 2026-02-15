"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LocationPicker } from "@/components/location/location-picker";
import { useTranslations } from "next-intl";
import type { ProjectState } from "@/actions/projects";

interface ProjectFormProps {
  action: (
    prevState: ProjectState,
    formData: FormData
  ) => Promise<ProjectState>;
  initialData?: {
    title: string;
    description: string | null;
    totalBudget: number;
    latitude: number | null;
    longitude: number | null;
    address: string | null;
  };
  submitLabel: string;
  pendingLabel: string;
}

const initialState: ProjectState = { error: null };

export function ProjectForm({
  action,
  initialData,
  submitLabel,
  pendingLabel,
}: ProjectFormProps) {
  const t = useTranslations();
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-md bg-danger-red/10 p-3 text-sm text-danger-red">
          {state.error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">{t("projects.projectTitle")}</Label>
        <Input
          id="title"
          name="title"
          placeholder={t("projects.projectTitlePlaceholder")}
          defaultValue={initialData?.title}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t("projects.description")}</Label>
        <Textarea
          id="description"
          name="description"
          placeholder={t("projects.descriptionPlaceholder")}
          defaultValue={initialData?.description ?? ""}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="totalBudget">{t("projects.totalBudgetField")}</Label>
        <Input
          id="totalBudget"
          name="totalBudget"
          type="number"
          step="0.01"
          min="1"
          placeholder={t("projects.budgetPlaceholder")}
          defaultValue={
            initialData ? (initialData.totalBudget / 100).toFixed(2) : undefined
          }
          required
        />
      </div>

      <LocationPicker
        showAddressField
        required
        initialLatitude={initialData?.latitude}
        initialLongitude={initialData?.longitude}
        initialAddress={initialData?.address ?? undefined}
      />

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}
