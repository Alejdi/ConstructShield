"use client";

import { useState, useEffect, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { locales, localeNames, type Locale } from "@/i18n/config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

const HINT_KEY = "lang-hint-dismissed";

export function LanguageSwitcher() {
  const currentLocale = useLocale() as Locale;
  const router = useRouter();
  const t = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(HINT_KEY)) {
        setShowHint(true);
      }
    } catch {
      // localStorage not available
    }
  }, []);

  function dismissHint() {
    setShowHint(false);
    try {
      localStorage.setItem(HINT_KEY, "1");
    } catch {
      // localStorage not available
    }
  }

  function handleLocaleChange(newLocale: Locale) {
    dismissHint();
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <DropdownMenu onOpenChange={(open) => { if (open) dismissHint(); }}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isPending} className="relative">
          <Globe className="h-5 w-5" />
          <span className="sr-only">{t("changeLanguage")}</span>
          {showHint && (
            <span className="absolute -top-0.5 -end-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      {showHint && (
        <div className="absolute top-full mt-1 whitespace-nowrap rounded bg-foreground px-2.5 py-1 text-[10px] font-medium text-background">
          {t("changeLanguage")}
        </div>
      )}
      <DropdownMenuContent align="end">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => handleLocaleChange(locale)}
            className={currentLocale === locale ? "bg-foreground/5 font-medium" : ""}
          >
            {localeNames[locale]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
