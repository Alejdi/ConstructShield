import type {
  BidStatus,
  MilestoneStatus,
  ProjectStatus,
  ServiceListingStatus,
  SubscriptionTier,
} from "@/lib/types/database";

export const PLATFORM_FEE_PERCENT = 5;

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: "Draft",
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
  funded: "bg-foreground/5 text-foreground",
  work_in_progress: "bg-warning-amber/10 text-warning-amber",
  verification_pending: "bg-foreground/10 text-foreground",
  released: "bg-trust-green/10 text-trust-green",
};

export const SUBSCRIPTION_TIER_LABELS: Record<SubscriptionTier, string> = {
  basic: "Basic",
  pro: "Pro",
  elite: "Elite",
};

export const SUBSCRIPTION_TIER_COLORS: Record<SubscriptionTier, string> = {
  basic: "bg-muted text-muted-foreground",
  pro: "bg-foreground/5 text-foreground",
  elite: "bg-foreground/10 text-foreground",
};

export const SEARCH_RADIUS_OPTIONS = [
  { label: "5 km", value: 5000 },
  { label: "25 km", value: 25000 },
  { label: "50 km", value: 50000 },
  { label: "All", value: 0 },
] as const;

export const ON_SITE_RADIUS_METERS = 200;

export const BID_STATUS_LABELS: Record<BidStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const BID_STATUS_COLORS: Record<BidStatus, string> = {
  pending: "bg-warning-amber/10 text-warning-amber",
  accepted: "bg-trust-green/10 text-trust-green",
  rejected: "bg-danger-red/10 text-danger-red",
  withdrawn: "bg-muted text-muted-foreground",
};

export const SERVICE_LISTING_STATUS_LABELS: Record<
  ServiceListingStatus,
  string
> = {
  active: "Active",
  paused: "Paused",
};

export const SUBSCRIPTION_PLANS = [
  {
    tier: "basic" as const,
    name: "Basic",
    monthlyPrice: 900,
    yearlyPrice: 8640,
    bidsPerMonth: 3,
    maxListings: 1,
    prioritySearch: false,
  },
  {
    tier: "pro" as const,
    name: "Pro",
    monthlyPrice: 2900,
    yearlyPrice: 27840,
    bidsPerMonth: 15,
    maxListings: 5,
    prioritySearch: true,
  },
  {
    tier: "elite" as const,
    name: "Elite",
    monthlyPrice: 7900,
    yearlyPrice: 75840,
    bidsPerMonth: Infinity,
    maxListings: Infinity,
    prioritySearch: true,
  },
] as const;

export const SERVICE_CATEGORIES = [
  { label: "Kitchen Renovation", value: "kitchen" },
  { label: "Bathroom Renovation", value: "bathroom" },
  { label: "Roofing", value: "roofing" },
  { label: "Plumbing", value: "plumbing" },
  { label: "Electrical", value: "electrical" },
  { label: "Painting", value: "painting" },
  { label: "Flooring", value: "flooring" },
  { label: "Landscaping", value: "landscaping" },
  { label: "General Construction", value: "general" },
  { label: "Other", value: "other" },
] as const;
