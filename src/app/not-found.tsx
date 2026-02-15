import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-4 text-center">
      <p className="text-8xl font-black tracking-tight">{t("errors.error404")}</p>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">{t("errors.pageNotFound")}</h1>
        <p className="text-muted-foreground">
          {t("errors.pageNotFoundDesc")}
        </p>
      </div>
      <Link
        href="/"
        className="border border-foreground px-6 py-2.5 text-xs font-medium uppercase tracking-[0.2em] transition-colors hover:bg-foreground hover:text-background"
      >
        {t("common.goHome")}
      </Link>
    </div>
  );
}
