import type {
  BidStatus,
  MilestoneStatus,
  ProjectStatus,
  ServiceListingStatus,
  SubscriptionTier,
} from "@/lib/types/database";

export function projectStatusKey(status: ProjectStatus): string {
  return `projects.status.${status}`;
}

export function milestoneStatusKey(status: MilestoneStatus): string {
  return `milestones.status.${status}`;
}

export function bidStatusKey(status: BidStatus): string {
  return `bids.status.${status}`;
}

export function serviceListingStatusKey(status: ServiceListingStatus): string {
  return `services.status.${status}`;
}

export function subscriptionTierKey(tier: SubscriptionTier): string {
  return `subscriptions.tiers.${tier}`;
}

export function serviceCategoryKey(value: string): string {
  return `services.categories.${value}`;
}
