import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTranslations } from "next-intl/server";

interface RatingSummaryProps {
  avgRating: number;
  reviewCount: number;
  distribution?: Record<number, number>;
}

export async function RatingSummary({
  avgRating,
  reviewCount,
  distribution,
}: RatingSummaryProps) {
  const t = await getTranslations();
  if (reviewCount === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t("admin.noReviews")}</p>
    );
  }

  return (
    <div className="flex gap-8">
      {/* Big number */}
      <div className="flex flex-col items-center">
        <span className="text-4xl font-black tracking-tight">
          {avgRating.toFixed(1)}
        </span>
        <div className="mt-1 flex gap-0.5">
          {[1, 2, 3, 4, 5].map((value) => (
            <Star
              key={value}
              className={cn(
                "h-3.5 w-3.5",
                value <= Math.round(avgRating)
                  ? "fill-foreground text-foreground"
                  : "text-muted-foreground/30"
              )}
            />
          ))}
        </div>
        <span className="mt-1 text-xs text-muted-foreground">
          {t("reviews.reviewCount", { count: reviewCount })}
        </span>
      </div>

      {/* Distribution bars */}
      {distribution && (
        <div className="flex flex-1 flex-col justify-center gap-1.5">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = distribution[stars] ?? 0;
            const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0;

            return (
              <div key={stars} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-right text-muted-foreground">
                  {stars}
                </span>
                <Star className="h-3 w-3 text-muted-foreground/50" />
                <div className="h-2 flex-1 bg-muted">
                  <div
                    className="h-full bg-foreground transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-6 text-right text-muted-foreground">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
