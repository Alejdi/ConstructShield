import { Star } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { getTranslations } from "next-intl/server";

interface ReviewCardProps {
  rating: number;
  comment: string | null;
  clientName: string;
  projectTitle: string;
  createdAt: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={cn(
            "h-3.5 w-3.5",
            value <= rating
              ? "fill-foreground text-foreground"
              : "text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );
}

export async function ReviewCard({
  rating,
  comment,
  clientName,
  projectTitle,
  createdAt,
}: ReviewCardProps) {
  const t = await getTranslations();
  return (
    <div className="border-t pt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StarRating rating={rating} />
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(createdAt)}
          </span>
        </div>
      </div>
      <p className="mt-1 text-sm font-medium">{clientName}</p>
      <p className="text-xs text-muted-foreground">
        {t("reviews.projectLabel", { title: projectTitle })}
      </p>
      {comment && (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {comment}
        </p>
      )}
    </div>
  );
}

export { StarRating };
