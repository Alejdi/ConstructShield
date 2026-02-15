import type { SubscriptionTier } from "@/lib/types/database";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";

type ContractorSubscription = {
  subscription_status: string;
  trial_ends_at: string;
  subscription_tier: SubscriptionTier;
};

export function isSubscriptionActive(contractor: ContractorSubscription): boolean {
  if (contractor.subscription_status === "active") return true;
  if (
    contractor.subscription_status === "trialing" &&
    new Date(contractor.trial_ends_at) > new Date()
  ) {
    return true;
  }
  return false;
}

export function getContractorLimits(tier: SubscriptionTier) {
  const plan = SUBSCRIPTION_PLANS.find((p) => p.tier === tier);
  return {
    bidsPerMonth: plan?.bidsPerMonth ?? 3,
    maxListings: plan?.maxListings ?? 1,
    prioritySearch: plan?.prioritySearch ?? false,
  };
}

export async function getMonthlyBidCount(
  supabase: { from: (table: string) => any },
  contractorId: string
): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count } = await supabase
    .from("bids")
    .select("id", { count: "exact", head: true })
    .eq("contractor_id", contractorId)
    .gte("created_at", startOfMonth);

  return count ?? 0;
}

export async function getActiveListingCount(
  supabase: { from: (table: string) => any },
  contractorId: string
): Promise<number> {
  const { count } = await supabase
    .from("service_listings")
    .select("id", { count: "exact", head: true })
    .eq("contractor_id", contractorId)
    .eq("status", "active");

  return count ?? 0;
}

export async function canPlaceBid(
  supabase: { from: (table: string) => any },
  contractor: ContractorSubscription & { id: string }
): Promise<{ allowed: boolean; reason?: string }> {
  if (!isSubscriptionActive(contractor)) {
    return {
      allowed: false,
      reason: "Your subscription is inactive. Subscribe to place bids.",
    };
  }

  const limits = getContractorLimits(contractor.subscription_tier);
  if (limits.bidsPerMonth === Infinity) return { allowed: true };

  const count = await getMonthlyBidCount(supabase, contractor.id);
  if (count >= limits.bidsPerMonth) {
    return {
      allowed: false,
      reason: `You've reached your ${limits.bidsPerMonth} bid limit this month. Upgrade to place more bids.`,
    };
  }

  return { allowed: true };
}

export async function canCreateListing(
  supabase: { from: (table: string) => any },
  contractor: ContractorSubscription & { id: string }
): Promise<{ allowed: boolean; reason?: string }> {
  if (!isSubscriptionActive(contractor)) {
    return {
      allowed: false,
      reason: "Your subscription is inactive. Subscribe to create listings.",
    };
  }

  const limits = getContractorLimits(contractor.subscription_tier);
  if (limits.maxListings === Infinity) return { allowed: true };

  const count = await getActiveListingCount(supabase, contractor.id);
  if (count >= limits.maxListings) {
    return {
      allowed: false,
      reason: `You've reached your ${limits.maxListings} listing limit. Upgrade to create more listings.`,
    };
  }

  return { allowed: true };
}
