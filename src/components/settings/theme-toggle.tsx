"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

const themes = [
  { value: "light", icon: Sun },
  { value: "system", icon: Monitor },
  { value: "dark", icon: Moon },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("settings");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="flex gap-1 rounded-full border p-1 h-10 w-[156px]" />;
  }

  return (
    <div className="flex gap-1 rounded-full border p-1">
      {themes.map(({ value, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={cn(
            "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            theme === value
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {t(`theme.${value}`)}
        </button>
      ))}
    </div>
  );
}
