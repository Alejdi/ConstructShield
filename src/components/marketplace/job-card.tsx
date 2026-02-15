import Link from "next/link";
import Image from "next/image";
import { MapPin, Clock, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";

interface JobCardProps {
  id: string;
  title: string;
  description: string | null;
  totalBudget: number;
  address: string | null;
  createdAt: string;
  clientName: string;
  bidCount: number;
  isOwner?: boolean;
  thumbnailUrl?: string | null;
}

export async function JobCard({
  id,
  title,
  description,
  totalBudget,
  address,
  createdAt,
  clientName,
  bidCount,
  isOwner,
  thumbnailUrl,
}: JobCardProps) {
  const t = await getTranslations();
  return (
    <Link
      href={`/marketplace/jobs/${id}`}
      className="block border p-6 transition-colors hover:bg-muted/50"
    >
      <div className="flex items-start gap-4">
        {thumbnailUrl && (
          <div className="relative hidden h-20 w-20 shrink-0 overflow-hidden rounded border sm:block">
            <Image
              src={thumbnailUrl}
              alt=""
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-lg font-bold">{title}</h3>
            {isOwner && (
              <span className="shrink-0 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {t("marketplace.yourPost")}
              </span>
            )}
          </div>
          {description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {description}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {formatCurrency(totalBudget)}
            </span>
            {address && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {address}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatRelativeTime(createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {t("marketplace.bidCount", { count: bidCount })}
            </span>
          </div>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {t("marketplace.postedBy", { name: clientName })}
      </p>
    </Link>
  );
}
