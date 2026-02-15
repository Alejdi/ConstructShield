"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { canPlaceBid } from "@/lib/subscription";
import { notify } from "@/lib/notifications";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/utils";
import type { SubscriptionTier } from "@/lib/types/database";

const submitBidSchema = z.object({
  projectId: z.string().uuid(),
  amount: z.coerce.number().positive(),
  message: z.string().max(2000).optional(),
});

export type BidState = {
  error: string | null;
  success?: boolean;
};

export async function submitBid(
  _prevState: BidState,
  formData: FormData
): Promise<BidState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { data: profileData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const profile = profileData as { role: string } | null;
  if (profile?.role !== "contractor") {
    return { error: "Only contractors can submit bids" };
  }

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
    const check = await canPlaceBid(supabase, contractor);
    if (!check.allowed) {
      return { error: check.reason! };
    }
  }

  const parsed = submitBidSchema.safeParse({
    projectId: formData.get("projectId"),
    amount: formData.get("amount"),
    message: formData.get("message") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { error } = await supabase.from("bids").insert({
    project_id: parsed.data.projectId,
    contractor_id: user.id,
    amount: Math.round(parsed.data.amount * 100),
    message: parsed.data.message ?? null,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "You already submitted a bid on this project" };
    }
    return { error: error.message };
  }

  // Notify the project client about the new bid
  const admin = getSupabaseAdmin();
  const { data: projData } = await admin
    .from("projects")
    .select("client_id, title")
    .eq("id", parsed.data.projectId)
    .single();
  const proj = projData as { client_id: string; title: string } | null;

  const { data: contractorProfile } = await admin
    .from("contractors")
    .select("business_name")
    .eq("id", user.id)
    .single();
  const contractorName = (contractorProfile as { business_name: string } | null)?.business_name ?? "A contractor";

  if (proj) {
    notify({
      userId: proj.client_id,
      type: "bid_received",
      title: "New Bid Received",
      body: `${contractorName} bid ${formatCurrency(Math.round(parsed.data.amount * 100))} on ${proj.title}`,
      actionUrl: `/client/projects/${parsed.data.projectId}`,
    }).catch(() => {});
  }

  revalidatePath("/marketplace/jobs");
  revalidatePath(`/marketplace/jobs/${parsed.data.projectId}`);
  return { error: null, success: true };
}

export async function acceptBid(bidId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data: bidData } = await supabase
    .from("bids")
    .select("id, project_id, contractor_id, amount, status")
    .eq("id", bidId)
    .single();

  const bid = bidData as {
    id: string;
    project_id: string;
    contractor_id: string;
    amount: number;
    status: string;
  } | null;

  if (!bid) throw new Error("Bid not found");
  if (bid.status !== "pending") throw new Error("Bid already processed");

  const { data: projectData } = await supabase
    .from("projects")
    .select("client_id, status")
    .eq("id", bid.project_id)
    .single();

  const project = projectData as {
    client_id: string;
    status: string;
  } | null;

  if (!project || project.client_id !== user.id) {
    throw new Error("Forbidden");
  }
  if (project.status !== "bidding") {
    throw new Error("Project is not accepting bids");
  }

  // Accept this bid
  await supabase
    .from("bids")
    .update({ status: "accepted" })
    .eq("id", bidId);

  // Reject all other pending bids
  await supabase
    .from("bids")
    .update({ status: "rejected" })
    .eq("project_id", bid.project_id)
    .neq("id", bidId)
    .eq("status", "pending");

  // Update project: assign contractor, activate, set budget
  await supabase
    .from("projects")
    .update({
      contractor_id: bid.contractor_id,
      status: "active",
      total_budget: bid.amount,
      is_public: false,
    })
    .eq("id", bid.project_id);

  // Fetch project title for notifications
  const { data: projInfo } = await supabase
    .from("projects")
    .select("title")
    .eq("id", bid.project_id)
    .single();
  const projectTitle = (projInfo as { title: string } | null)?.title ?? "a project";

  // Notify accepted contractor
  notify({
    userId: bid.contractor_id,
    type: "bid_accepted",
    title: "Bid Accepted",
    body: `Your bid on ${projectTitle} was accepted`,
    actionUrl: `/contractor/projects/${bid.project_id}`,
  }).catch(() => {});

  // Notify rejected contractors
  const admin = getSupabaseAdmin();
  const { data: rejectedBids } = await admin
    .from("bids")
    .select("contractor_id")
    .eq("project_id", bid.project_id)
    .eq("status", "rejected");

  if (rejectedBids) {
    for (const rb of rejectedBids as { contractor_id: string }[]) {
      notify({
        userId: rb.contractor_id,
        type: "bid_rejected",
        title: "Bid Not Selected",
        body: `Your bid on ${projectTitle} was not selected`,
        actionUrl: "/marketplace/jobs",
      }).catch(() => {});
    }
  }

  revalidatePath(`/client/projects/${bid.project_id}`);
  revalidatePath("/marketplace/jobs");
}

export async function rejectBid(bidId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data: bidData } = await supabase
    .from("bids")
    .select("id, project_id, contractor_id, status")
    .eq("id", bidId)
    .single();

  const bid = bidData as {
    id: string;
    project_id: string;
    contractor_id: string;
    status: string;
  } | null;

  if (!bid) throw new Error("Bid not found");
  if (bid.status !== "pending") throw new Error("Bid already processed");

  const { data: projectData } = await supabase
    .from("projects")
    .select("client_id, title, status")
    .eq("id", bid.project_id)
    .single();

  const project = projectData as {
    client_id: string;
    title: string;
    status: string;
  } | null;

  if (!project || project.client_id !== user.id) {
    throw new Error("Forbidden");
  }
  if (project.status !== "bidding") {
    throw new Error("Project is not accepting bids");
  }

  await supabase
    .from("bids")
    .update({ status: "rejected" })
    .eq("id", bidId);

  notify({
    userId: bid.contractor_id,
    type: "bid_rejected",
    title: "Bid Not Selected",
    body: `Your bid on ${project.title} was not selected`,
    actionUrl: "/marketplace/jobs",
  }).catch(() => {});

  revalidatePath(`/client/projects/${bid.project_id}`);
  revalidatePath("/marketplace/jobs");
  revalidatePath(`/marketplace/jobs/${bid.project_id}`);
}

export async function withdrawBid(bidId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  await supabase
    .from("bids")
    .update({ status: "withdrawn" })
    .eq("id", bidId)
    .eq("contractor_id", user.id)
    .eq("status", "pending");

  revalidatePath("/marketplace/jobs");
}
