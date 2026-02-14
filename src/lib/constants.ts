import type {
  MilestoneStatus,
  ProjectStatus,
  SubscriptionTier,
} from "@/lib/types/database";

export const PLATFORM_FEE_PERCENT = 5;

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  bidding: "Accepting Bids",
  active: "Active",
  completed: "Completed",
  disputed: "Disputed",
};

export const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  waiting_for_funds: "Waiting for Funds",
  funded: "Funded",
  work_in_progress: "Work in Progress",
  verification_pending: "Verification Pending",
  released: "Released",
};

export const MILESTONE_STATUS_COLORS: Record<MilestoneStatus, string> = {
  waiting_for_funds: "bg-muted text-muted-foreground",
  funded: "bg-brand-100 text-brand-700",
  work_in_progress: "bg-warning-amber/10 text-warning-amber",
  verification_pending: "bg-brand-100 text-brand-600",
  released: "bg-trust-green/10 text-trust-green",
};

export const SUBSCRIPTION_TIER_LABELS: Record<SubscriptionTier, string> = {
  basic: "Basic",
  pro: "Pro",
  elite: "Elite",
};

export const SUBSCRIPTION_TIER_COLORS: Record<SubscriptionTier, string> = {
  basic: "bg-muted text-muted-foreground",
  pro: "bg-brand-100 text-brand-700",
  elite: "bg-warning-amber/10 text-warning-amber",
};
