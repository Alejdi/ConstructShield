import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <Link
            href="/"
            className="text-sm font-bold uppercase tracking-[0.3em]"
          >
            {t("common.constructshield")}
          </Link>
          <LanguageSwitcher />
        </div>
        <div className="border p-8">{children}</div>
      </div>
    </div>
  );
}
