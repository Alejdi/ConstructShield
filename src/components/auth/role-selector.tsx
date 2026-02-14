"use client";

import { cn } from "@/lib/utils";
import { HardHat, User } from "lucide-react";

interface RoleSelectorProps {
  value: "client" | "contractor";
  onChange: (role: "client" | "contractor") => void;
}

export function RoleSelector({ value, onChange }: RoleSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => onChange("client")}
        className={cn(
          "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
          value === "client"
            ? "border-brand-600 bg-brand-50 text-brand-700"
            : "border-border hover:border-muted-foreground/50"
        )}
      >
        <User className="h-6 w-6" />
        <span className="text-sm font-medium">Client</span>
        <span className="text-xs text-muted-foreground">
          I need construction work done
        </span>
      </button>
      <button
        type="button"
        onClick={() => onChange("contractor")}
        className={cn(
          "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
          value === "contractor"
            ? "border-brand-600 bg-brand-50 text-brand-700"
            : "border-border hover:border-muted-foreground/50"
        )}
      >
        <HardHat className="h-6 w-6" />
        <span className="text-sm font-medium">Contractor</span>
        <span className="text-xs text-muted-foreground">
          I provide construction services
        </span>
      </button>
    </div>
  );
}
