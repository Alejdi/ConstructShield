"use client";

import { useActionState } from "react";
import { createMilestone, type MilestoneState } from "@/actions/milestones";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle } from "lucide-react";
import { useTranslations } from "next-intl";

const initialState: MilestoneState = { error: null };

interface AddMilestoneFormProps {
  projectId: string;
  nextOrderIndex: number;
}

export function AddMilestoneForm({
  projectId,
  nextOrderIndex,
}: AddMilestoneFormProps) {
  const t = useTranslations();
  const [state, formAction, isPending] = useActionState(
    createMilestone,
    initialState
  );

  return (
    <form action={formAction} className="space-y-3">
      <h4 className="font-medium">{t("milestones.addMilestone")}</h4>

      {state.error && (
        <div className="rounded-md bg-danger-red/10 p-3 text-sm text-danger-red">
          {state.error}
        </div>
      )}

      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="orderIndex" value={nextOrderIndex} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">{t("milestones.milestoneTitle")}</Label>
          <Input
            id="title"
            name="title"
            placeholder={t("milestones.milestoneTitlePlaceholder")}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">{t("milestones.amount")}</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="1"
            placeholder={t("milestones.amountPlaceholder")}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t("milestones.descriptionOptional")}</Label>
        <Input
          id="description"
          name="description"
          placeholder={t("milestones.descriptionPlaceholder")}
        />
      </div>

      <Button type="submit" variant="outline" disabled={isPending}>
        <PlusCircle className="me-2 h-4 w-4" />
        {isPending ? t("milestones.adding") : t("milestones.addMilestone")}
      </Button>
    </form>
  );
}
