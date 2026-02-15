"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Gavel, Search } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { projectStatusKey } from "@/lib/i18n-constants";
import type { ProjectStatus, MilestoneStatus } from "@/lib/types/database";
import { DeleteProjectButton } from "@/components/projects/delete-project-button";

type ProjectWithMilestones = {
  id: string;
  title: string;
  total_budget: number;
  status: ProjectStatus;
  milestones: { id: string; status: MilestoneStatus; amount: number }[] | null;
  bids: { id: string; status: string }[] | null;
};

const STATUS_FILTERS: (ProjectStatus | "all")[] = [
  "all",
  "draft",
  "bidding",
  "active",
  "completed",
  "disputed",
];

interface ProjectListFilterProps {
  projects: ProjectWithMilestones[];
}

export function ProjectListFilter({ projects }: ProjectListFilterProps) {
  const t = useTranslations();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">(
    "all"
  );

  const filtered = projects.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (query && !p.title.toLowerCase().includes(query.toLowerCase()))
      return false;
    return true;
  });

  return (
    <div className="space-y-3">
      {/* Search + Status Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("dashboard.searchProjects")}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {s === "all"
                ? t("filters.all")
                : t(projectStatusKey(s))}
            </button>
          ))}
        </div>
      </div>

      {/* Filtered Project List */}
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t("dashboard.noMatchingProjects")}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((project) => (
            <div
              key={project.id}
              className="flex items-center justify-between border p-4 transition-colors hover:bg-muted/50"
            >
              <Link
                href={`/client/projects/${project.id}`}
                className="flex-1"
              >
                <h3 className="font-medium">{project.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(project.total_budget)} &middot;{" "}
                  {project.milestones?.length ?? 0} {t("projects.milestones")}
                </p>
              </Link>
              <div className="flex items-center gap-2">
                {project.status === "bidding" &&
                  (project.bids?.filter((b) => b.status === "pending").length ??
                    0) > 0 && (
                    <Badge className="bg-warning-amber/10 text-warning-amber">
                      <Gavel className="me-1 h-3 w-3" />
                      {
                        project.bids?.filter((b) => b.status === "pending")
                          .length
                      }{" "}
                      {t("bids.pendingBids")}
                    </Badge>
                  )}
                <Badge variant="secondary">
                  {t(projectStatusKey(project.status))}
                </Badge>
                {(project.status === "draft" ||
                  project.status === "bidding") && (
                  <DeleteProjectButton
                    projectId={project.id}
                    projectTitle={project.title}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
