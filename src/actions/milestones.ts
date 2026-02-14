"use server";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createHold, captureHold } from "@/lib/stripe/escrow";
import { stripe } from "@/lib/stripe/client";
import { revalidatePath } from "next/cache";
import { z } from "zod/v4";

const createMilestoneSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  amount: z.coerce.number().positive(),
  orderIndex: z.coerce.number().int().min(0),
});

export type MilestoneState = {
  error: string | null;
};

export async function createMilestone(
  _prevState: MilestoneState,
  formData: FormData
): Promise<MilestoneState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const parsed = createMilestoneSchema.safeParse({
    projectId: formData.get("projectId"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    amount: formData.get("amount"),
    orderIndex: formData.get("orderIndex"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { error } = await supabase.from("milestones").insert({
    project_id: parsed.data.projectId,
    title: parsed.data.title,
    description: parsed.data.description,
    amount: Math.round(parsed.data.amount * 100),
    order_index: parsed.data.orderIndex,
  });

  if (error) return { error: error.message };

  revalidatePath(`/client/projects/${parsed.data.projectId}`);
  return { error: null };
}

export async function fundMilestone(milestoneId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const admin = getSupabaseAdmin();

  // Fetch milestone with project and contractor info
  const { data: milestoneData } = await admin
    .from("milestones")
    .select("id, amount, status, project_id")
    .eq("id", milestoneId)
    .single();

  const milestone = milestoneData as {
    id: string;
    amount: number;
    status: string;
    project_id: string;
  } | null;

  if (!milestone) throw new Error("Milestone not found");
  if (milestone.status !== "waiting_for_funds")
    throw new Error("Invalid state");

  const { data: projectData } = await admin
    .from("projects")
    .select("client_id, contractor_id")
    .eq("id", milestone.project_id)
    .single();

  const project = projectData as {
    client_id: string;
    contractor_id: string | null;
  } | null;

  if (!project || project.client_id !== user.id)
    throw new Error("Forbidden");

  const { data: contractorData } = await admin
    .from("contractors")
    .select("stripe_connect_account_id")
    .eq("id", project.contractor_id!)
    .single();

  const contractor = contractorData as {
    stripe_connect_account_id: string | null;
  } | null;

  if (!contractor?.stripe_connect_account_id)
    throw new Error("Contractor has not connected Stripe");

  // Get or create Stripe customer for the client
  const { data: profileData } = await admin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  const profile = profileData as { stripe_customer_id: string | null } | null;
  let customerId = profile?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email! });
    customerId = customer.id;
    await admin
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  // Create the payment hold
  const paymentIntent = await createHold({
    amount: milestone.amount,
    customerId,
    connectedAccountId: contractor.stripe_connect_account_id,
    milestoneId: milestone.id,
    projectId: milestone.project_id,
  });

  // Transition milestone status
  await admin.rpc("transition_milestone_status", {
    p_milestone_id: milestoneId,
    p_new_status: "funded",
    p_user_id: user.id,
  });

  await admin
    .from("milestones")
    .update({ stripe_payment_intent_id: paymentIntent.id })
    .eq("id", milestoneId);

  revalidatePath(`/client/projects/${milestone.project_id}`);

  return { clientSecret: paymentIntent.client_secret };
}

export async function startWork(milestoneId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const admin = getSupabaseAdmin();
  const result = await admin.rpc("transition_milestone_status", {
    p_milestone_id: milestoneId,
    p_new_status: "work_in_progress",
    p_user_id: user.id,
  });

  if (result.error) throw new Error(result.error.message);

  const milestone = result.data as unknown as { project_id: string };
  revalidatePath(`/contractor/projects/${milestone.project_id}`);
}

export async function submitProof(
  milestoneId: string,
  proofVideoUrl: string,
  proofVideoAssetId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const admin = getSupabaseAdmin();
  await admin
    .from("milestones")
    .update({
      proof_video_url: proofVideoUrl,
      proof_video_asset_id: proofVideoAssetId,
    })
    .eq("id", milestoneId);

  const result = await admin.rpc("transition_milestone_status", {
    p_milestone_id: milestoneId,
    p_new_status: "verification_pending",
    p_user_id: user.id,
  });

  if (result.error) throw new Error(result.error.message);

  const milestone = result.data as unknown as { project_id: string };
  revalidatePath(`/contractor/projects/${milestone.project_id}`);
}

export async function releaseFunds(milestoneId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const admin = getSupabaseAdmin();
  const { data: milestoneData } = await admin
    .from("milestones")
    .select("stripe_payment_intent_id, project_id")
    .eq("id", milestoneId)
    .single();

  const milestone = milestoneData as {
    stripe_payment_intent_id: string | null;
    project_id: string;
  } | null;

  if (!milestone?.stripe_payment_intent_id)
    throw new Error("No payment hold found");

  await captureHold(milestone.stripe_payment_intent_id);

  await admin.rpc("transition_milestone_status", {
    p_milestone_id: milestoneId,
    p_new_status: "released",
    p_user_id: user.id,
  });

  revalidatePath(`/client/projects/${milestone.project_id}`);
}
