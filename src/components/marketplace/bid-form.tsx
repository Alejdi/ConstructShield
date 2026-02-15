"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { submitBid, type BidState } from "@/actions/bids";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: BidState = { error: null };

interface BidFormProps {
  projectId: string;
  suggestedBudget: number;
}

export function BidForm({ projectId, suggestedBudget }: BidFormProps) {
  const t = useTranslations();
  const [state, formAction, isPending] = useActionState(
    submitBid,
    initialState
  );

  if (state.success) {
    return (
      <div className="border border-trust-green/20 bg-trust-green/5 p-4">
        <p className="text-sm font-medium text-trust-green">
          {t("bids.bidSubmitted")}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="projectId" value={projectId} />

      {state.error && (
        <div className="bg-danger-red/10 p-3 text-sm text-danger-red">
          {state.error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="amount">{t("bids.yourBid")}</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="1"
          placeholder={(suggestedBudget / 100).toString()}
          required
        />
        <p className="text-xs text-muted-foreground">
          {t("bids.clientBudget", { budget: (suggestedBudget / 100).toLocaleString() })}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">{t("bids.proposal")}</Label>
        <Textarea
          id="message"
          name="message"
          placeholder={t("bids.proposalPlaceholder")}
          rows={4}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? t("bids.submitting") : t("bids.submitBid")}
      </Button>
    </form>
  );
}
