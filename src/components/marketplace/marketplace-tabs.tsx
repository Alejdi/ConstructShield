"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function MarketplaceTabs() {
  const t = useTranslations();
  const pathname = usePathname();
  const isJobs = pathname.startsWith("/marketplace/jobs");
  const isServices = pathname.startsWith("/marketplace/services");

  return (
    <div className="mb-8 flex gap-0 border-b">
      <Link
        href="/marketplace/jobs"
        className={cn(
          "border-b-2 px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] transition-colors",
          isJobs
            ? "border-foreground text-foreground"
            : "border-transparent text-muted-foreground hover:text-foreground"
        )}
      >
        {t("marketplace.jobBoard")}
      </Link>
      <Link
        href="/marketplace/services"
        className={cn(
          "border-b-2 px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] transition-colors",
          isServices
            ? "border-foreground text-foreground"
            : "border-transparent text-muted-foreground hover:text-foreground"
        )}
      >
        {t("services.servicesTitle")}
      </Link>
    </div>
  );
}
