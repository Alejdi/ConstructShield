"use client";

import { formatCurrency, formatDate, cn } from "@/lib/utils";
import type { MilestoneStatus } from "@/lib/types/database";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

interface TimelineMilestone {
  id: string;
  title: string;
  amount: number;
  status: MilestoneStatus;
  funded_at: string | null;
  checked_in_at: string | null;
  released_at: string | null;
}

interface MilestoneTimelineProps {
  milestones: TimelineMilestone[];
}

const STATUS_ORDER: MilestoneStatus[] = [
  "waiting_for_funds",
  "funded",
  "work_in_progress",
  "verification_pending",
  "released",
];

function getStatusIndex(status: MilestoneStatus): number {
  return STATUS_ORDER.indexOf(status);
}

export function MilestoneTimeline({ milestones }: MilestoneTimelineProps) {
  const t = useTranslations();

  function getSteps(milestone: TimelineMilestone) {
    const idx = getStatusIndex(milestone.status);

    return [
      {
        label: t("milestones.fund"),
        completed: idx >= 1,
        date: milestone.funded_at,
      },
      {
        label: t("milestones.workStarted"),
        completed: idx >= 2,
        date: milestone.checked_in_at,
      },
      {
        label: t("milestones.proofSubmitted"),
        completed: idx >= 3,
        date: null, // No dedicated timestamp for this transition
      },
      {
        label: t("projects.released"),
        completed: idx >= 4,
        date: milestone.released_at,
      },
    ];
  }

  if (milestones.length === 0) return null;

  const releasedCount = milestones.filter(
    (m) => m.status === "released"
  ).length;
  const totalAmount = milestones.reduce((sum, m) => sum + m.amount, 0);
  const releasedAmount = milestones
    .filter((m) => m.status === "released")
    .reduce((sum, m) => sum + m.amount, 0);
  const percentage = Math.round(
    (releasedAmount / (totalAmount || 1)) * 100
  );

  return (
    <div className="border">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {t("milestones.timeline")}
          </h3>
          <p className="mt-1 text-sm">
            {t("milestones.completedOf", { completed: releasedCount, total: milestones.length })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black tracking-tight">{percentage}%</p>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(releasedAmount)} / {formatCurrency(totalAmount)}
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-6 py-6">
        {milestones.map((milestone, i) => {
          const isLast = i === milestones.length - 1;
          const statusIdx = getStatusIndex(milestone.status);
          const isReleased = milestone.status === "released";
          const isInProgress = statusIdx >= 1 && statusIdx < 4;
          const steps = getSteps(milestone);

          return (
            <div key={milestone.id} className="flex gap-4">
              {/* Left: indicator + line */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                    isReleased
                      ? "border-trust-green bg-trust-green text-white"
                      : isInProgress
                        ? "border-foreground bg-foreground/10"
                        : "border-muted-foreground/30"
                  )}
                >
                  {isReleased && <Check className="h-3.5 w-3.5" />}
                  {isInProgress && (
                    <div className="h-2 w-2 rounded-full bg-foreground" />
                  )}
                </div>
                {!isLast && (
                  <div
                    className={cn(
                      "w-px flex-1 min-h-4",
                      isReleased ? "bg-trust-green" : "bg-border"
                    )}
                  />
                )}
              </div>

              {/* Right: content */}
              <div className={cn("pb-8", isLast && "pb-0")}>
                {/* Milestone header */}
                <div className="flex items-baseline gap-3">
                  <h4 className="font-medium leading-6">{milestone.title}</h4>
                  <span className="text-sm text-muted-foreground">
                    {formatCurrency(milestone.amount)}
                  </span>
                </div>

                {/* Sub-steps */}
                <div className="mt-2 space-y-1">
                  {milestone.status === "waiting_for_funds" ? (
                    <SubStep label={t("milestones.status.waiting_for_funds")} completed={false} />
                  ) : (
                    steps.map((step) => (
                      <SubStep
                        key={step.label}
                        label={step.label}
                        completed={step.completed}
                        date={step.date}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SubStep({
  label,
  completed,
  date,
}: {
  label: string;
  completed: boolean;
  date?: string | null;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className={cn(
          "inline-flex h-3.5 w-3.5 items-center justify-center rounded-full",
          completed
            ? "bg-foreground text-background"
            : "border border-muted-foreground/30"
        )}
      >
        {completed && <Check className="h-2 w-2" />}
      </span>
      <span
        className={cn(
          completed ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {label}
      </span>
      {completed && date && (
        <span className="text-muted-foreground">{formatDate(date)}</span>
      )}
    </div>
  );
}
