import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getTranslations } from "next-intl/server";
import { serviceCategoryKey } from "@/lib/i18n-constants";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle } from "lucide-react";

interface ServiceCardProps {
  id: string;
  title: string;
  description: string | null;
  category: string;
  startingPrice: number;
  contractorName: string;
  verified: boolean;
}

export async function ServiceCard({
  id,
  title,
  description,
  category,
  startingPrice,
  contractorName,
  verified,
}: ServiceCardProps) {
  const t = await getTranslations();
  return (
    <Link
      href={`/marketplace/services/${id}`}
      className="block border p-6 transition-colors hover:bg-muted/50"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold">{title}</h3>
          {description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {description}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
              {t(serviceCategoryKey(category))}
            </Badge>
            <span className="text-sm font-medium">
              {t("services.startingAt", { price: formatCurrency(startingPrice) })}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>{contractorName}</span>
        {verified && (
          <CheckCircle className="h-3 w-3 text-trust-green" />
        )}
      </div>
    </Link>
  );
}
