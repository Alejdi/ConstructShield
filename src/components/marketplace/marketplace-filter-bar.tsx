"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { FilterFieldConfig } from "@/lib/types/filters";

interface MarketplaceFilterBarProps {
  fields: FilterFieldConfig[];
}

export function MarketplaceFilterBar({ fields }: MarketplaceFilterBarProps) {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname]
  );

  const hasActiveFilters = fields.some((f) => {
    if (f.type === "range") {
      return (
        searchParams.has(f.param) ||
        (f.rangeMaxParam && searchParams.has(f.rangeMaxParam))
      );
    }
    return searchParams.has(f.param);
  });

  const clearAll = () => {
    router.push(pathname);
  };

  return (
    <div className="mb-6 flex flex-wrap items-end gap-4 border-b pb-6">
      {fields.map((field) => {
        switch (field.type) {
          case "search":
            return (
              <SearchField
                key={field.param}
                field={field}
                value={searchParams.get(field.param) ?? ""}
                onChange={(v) => updateParam(field.param, v)}
              />
            );
          case "select":
          case "sort":
            return (
              <SelectField
                key={field.param}
                field={field}
                value={searchParams.get(field.param) ?? ""}
                onChange={(v) => updateParam(field.param, v)}
              />
            );
          case "range":
            return (
              <RangeField
                key={field.param}
                field={field}
                minValue={searchParams.get(field.param) ?? ""}
                maxValue={
                  field.rangeMaxParam
                    ? searchParams.get(field.rangeMaxParam) ?? ""
                    : ""
                }
                onMinChange={(v) => updateParam(field.param, v)}
                onMaxChange={(v) =>
                  field.rangeMaxParam && updateParam(field.rangeMaxParam, v)
                }
              />
            );
          case "toggle":
            return (
              <ToggleField
                key={field.param}
                field={field}
                active={searchParams.get(field.param) === "true"}
                onToggle={() =>
                  updateParam(
                    field.param,
                    searchParams.get(field.param) === "true" ? "" : "true"
                  )
                }
              />
            );
          default:
            return null;
        }
      })}
      {hasActiveFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1 pb-0.5 text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-3 w-3" />
          {t("filters.clear")}
        </button>
      )}
    </div>
  );
}

function SearchField({
  field,
  value,
  onChange,
}: {
  field: FilterFieldConfig;
  value: string;
  onChange: (v: string) => void;
}) {
  const [local, setLocal] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const handleChange = (v: string) => {
    setLocal(v);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(v), 300);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
        {field.label}
      </span>
      <div className="relative">
        <Search className="absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-9 w-48 ps-8 text-sm"
          placeholder={field.placeholder}
          value={local}
          onChange={(e) => handleChange(e.target.value)}
        />
      </div>
    </div>
  );
}

function SelectField({
  field,
  value,
  onChange,
}: {
  field: FilterFieldConfig;
  value: string;
  onChange: (v: string) => void;
}) {
  const t = useTranslations();
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
        {field.label}
      </span>
      <Select
        value={value || "all"}
        onValueChange={(v) => onChange(v === "all" ? "" : v)}
      >
        <SelectTrigger className="h-9 w-44 text-xs uppercase tracking-[0.1em]">
          <SelectValue placeholder={t("filters.all")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("filters.all")}</SelectItem>
          {field.options?.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function RangeField({
  field,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
}: {
  field: FilterFieldConfig;
  minValue: string;
  maxValue: string;
  onMinChange: (v: string) => void;
  onMaxChange: (v: string) => void;
}) {
  const t = useTranslations();
  const [localMin, setLocalMin] = useState(minValue);
  const [localMax, setLocalMax] = useState(maxValue);
  const minTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setLocalMin(minValue);
  }, [minValue]);

  useEffect(() => {
    setLocalMax(maxValue);
  }, [maxValue]);

  const handleMin = (v: string) => {
    setLocalMin(v);
    clearTimeout(minTimerRef.current);
    minTimerRef.current = setTimeout(() => onMinChange(v), 300);
  };

  const handleMax = (v: string) => {
    setLocalMax(v);
    clearTimeout(maxTimerRef.current);
    maxTimerRef.current = setTimeout(() => onMaxChange(v), 300);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
        {field.label}
      </span>
      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          className="h-9 w-24 text-sm"
          placeholder={field.rangePlaceholders?.[0] ?? t("filters.minPlaceholder")}
          value={localMin}
          onChange={(e) => handleMin(e.target.value)}
        />
        <span className="text-muted-foreground">–</span>
        <Input
          type="number"
          className="h-9 w-24 text-sm"
          placeholder={field.rangePlaceholders?.[1] ?? t("filters.maxPlaceholder")}
          value={localMax}
          onChange={(e) => handleMax(e.target.value)}
        />
      </div>
    </div>
  );
}

function ToggleField({
  field,
  active,
  onToggle,
}: {
  field: FilterFieldConfig;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
        &nbsp;
      </span>
      <button
        onClick={onToggle}
        className={cn(
          "rounded-full border px-4 py-1.5 text-xs font-medium uppercase tracking-[0.1em] transition-colors",
          active
            ? "border-foreground bg-foreground text-background"
            : "text-muted-foreground hover:border-foreground hover:text-foreground"
        )}
      >
        {field.label}
      </button>
    </div>
  );
}
