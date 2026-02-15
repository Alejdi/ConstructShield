"use client";

import { useState, useActionState } from "react";
import { submitReview, type ReviewState } from "@/actions/reviews";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface ReviewFormProps {
  projectId: string;
  contractorId: string;
}

const initialState: ReviewState = { error: null };

export function ReviewForm({ projectId, contractorId }: ReviewFormProps) {
  const t = useTranslations();
  const [state, formAction, isPending] = useActionState(
    submitReview,
    initialState
  );
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);

  if (state.success) {
    return (
      <div className="flex items-center gap-3 border border-trust-green/30 p-4">
        <CheckCircle className="h-5 w-5 text-trust-green" />
        <p className="text-sm font-medium text-trust-green">
          {t("reviews.reviewSubmitted")}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="contractorId" value={contractorId} />
      <input type="hidden" name="rating" value={rating} />

      {state.error && (
        <div className="rounded-md bg-danger-red/10 p-3 text-sm text-danger-red">
          {state.error}
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {t("reviews.rating")}
        </p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              onMouseEnter={() => setHoveredRating(value)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  "h-7 w-7 transition-colors",
                  (hoveredRating || rating) >= value
                    ? "fill-foreground text-foreground"
                    : "text-muted-foreground/30"
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {t("reviews.commentOptional")}
        </p>
        <Textarea
          name="comment"
          placeholder={t("reviews.commentPlaceholder")}
          rows={4}
          maxLength={2000}
        />
      </div>

      <Button
        type="submit"
        disabled={isPending || rating === 0}
        variant="outline"
      >
        {isPending ? t("reviews.submitting") : t("reviews.submitReview")}
      </Button>
    </form>
  );
}
