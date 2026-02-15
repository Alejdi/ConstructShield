"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { useTranslations } from "next-intl";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations();

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg border p-8">
      <h2 className="mb-2 text-lg font-bold">{t("errors.somethingWentWrong")}</h2>
      {error.message && (
        <p className="mb-6 text-sm text-muted-foreground">{error.message}</p>
      )}
      <button
        onClick={reset}
        className="border border-foreground px-5 py-2 text-xs font-medium uppercase tracking-[0.15em] transition-colors hover:bg-foreground hover:text-background"
      >
        {t("common.tryAgain")}
      </button>
    </div>
  );
}
