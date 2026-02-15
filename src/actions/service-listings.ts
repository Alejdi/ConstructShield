"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod/v4";
import { canCreateListing } from "@/lib/subscription";
import type { SubscriptionTier } from "@/lib/types/database";

const serviceListingSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  category: z.string().min(1),
  startingPrice: z.coerce.number().positive(),
});

export type ServiceListingState = {
  error: string | null;
};

export async function createServiceListing(
  _prevState: ServiceListingState,
  formData: FormData
): Promise<ServiceListingState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  // Subscription gating
  const { data: contractorData } = await supabase
    .from("contractors")
    .select("id, subscription_tier, subscription_status, trial_ends_at")
    .eq("id", user.id)
    .single();

  const contractor = contractorData as {
    id: string;
    subscription_tier: SubscriptionTier;
    subscription_status: string;
    trial_ends_at: string;
  } | null;

  if (contractor) {
    const check = await canCreateListing(supabase, contractor);
    if (!check.allowed) {
      return { error: check.reason! };
    }
  }

  const parsed = serviceListingSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    category: formData.get("category"),
    startingPrice: formData.get("startingPrice"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const latStr = formData.get("latitude") as string;
  const lngStr = formData.get("longitude") as string;
  const latitude = latStr ? parseFloat(latStr) : null;
  const longitude = lngStr ? parseFloat(lngStr) : null;
  const address = (formData.get("address") as string) || null;

  if (!address || latitude === null || longitude === null) {
    return { error: "Address is required" };
  }

  const { error } = await supabase.from("service_listings").insert({
    contractor_id: user.id,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    category: parsed.data.category,
    starting_price: Math.round(parsed.data.startingPrice * 100),
    address,
    latitude,
    longitude,
  });

  if (error) return { error: error.message };

  revalidatePath("/marketplace/services");
  redirect("/contractor/services");
}

export async function updateServiceListing(
  listingId: string,
  _prevState: ServiceListingState,
  formData: FormData
): Promise<ServiceListingState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const parsed = serviceListingSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    category: formData.get("category"),
    startingPrice: formData.get("startingPrice"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const latStr = formData.get("latitude") as string;
  const lngStr = formData.get("longitude") as string;
  const latitude = latStr ? parseFloat(latStr) : null;
  const longitude = lngStr ? parseFloat(lngStr) : null;
  const address = (formData.get("address") as string) || null;

  if (!address || latitude === null || longitude === null) {
    return { error: "Address is required" };
  }

  const { error } = await supabase
    .from("service_listings")
    .update({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      category: parsed.data.category,
      starting_price: Math.round(parsed.data.startingPrice * 100),
      address,
      latitude,
      longitude,
    })
    .eq("id", listingId)
    .eq("contractor_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/marketplace/services");
  revalidatePath("/contractor/services");
  return { error: null };
}

export async function toggleServiceListingStatus(listingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data } = await supabase
    .from("service_listings")
    .select("status")
    .eq("id", listingId)
    .eq("contractor_id", user.id)
    .single();

  const listing = data as { status: string } | null;
  if (!listing) throw new Error("Listing not found");

  const newStatus = listing.status === "active" ? "paused" : "active";

  await supabase
    .from("service_listings")
    .update({ status: newStatus })
    .eq("id", listingId)
    .eq("contractor_id", user.id);

  revalidatePath("/marketplace/services");
  revalidatePath("/contractor/services");
}

export async function deleteServiceListing(listingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  await supabase
    .from("service_listings")
    .delete()
    .eq("id", listingId)
    .eq("contractor_id", user.id);

  revalidatePath("/marketplace/services");
  revalidatePath("/contractor/services");
}
