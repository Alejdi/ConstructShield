"use client";

import { cn } from "@/lib/utils";
import { HardHat, User } from "lucide-react";
import { useTranslations } from "next-intl";

interface RoleSelectorProps {
  value: "client" | "contractor";
  onChange: (role: "client" | "contractor") => void;
}

export function RoleSelector({ value, onChange }: RoleSelectorProps) {
  const t = useTranslations();

  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => onChange("client")}
        className={cn(
          "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
          value === "client"
            ? "border-foreground bg-foreground/5 text-foreground"
            : "border-border hover:border-foreground/50"
        )}
      >
        <User className="h-6 w-6" />
        <span className="text-sm font-medium">{t("auth.clientRole")}</span>
        <span className="text-xs text-muted-foreground">
          {t("auth.clientDesc")}
        </span>
      </button>
      <button
        type="button"
        onClick={() => onChange("contractor")}
        className={cn(
          "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
          value === "contractor"
            ? "border-foreground bg-foreground/5 text-foreground"
            : "border-border hover:border-foreground/50"
        )}
      >
        <HardHat className="h-6 w-6" />
        <span className="text-sm font-medium">{t("auth.contractorRole")}</span>
        <span className="text-xs text-muted-foreground">
          {t("auth.contractorDesc")}
        </span>
      </button>
    </div>
  );
}
