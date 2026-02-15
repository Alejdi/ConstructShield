"use server";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createHold, captureHold } from "@/lib/stripe/escrow";
import { stripe } from "@/lib/stripe/client";
import { revalidatePath } from "next/cache";
import { notify } from "@/lib/notifications";
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

export async function deleteMilestone(milestoneId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const admin = getSupabaseAdmin();
  const { data: milestoneData } = await admin
    .from("milestones")
    .select("id, status, project_id")
    .eq("id", milestoneId)
    .single();

  const milestone = milestoneData as {
    id: string;
    status: string;
    project_id: string;
  } | null;

  if (!milestone) throw new Error("Milestone not found");

  if (milestone.status !== "waiting_for_funds") {
    throw new Error("Only unfunded milestones can be deleted");
  }

  // Verify the user owns the project
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", milestone.project_id)
    .eq("client_id", user.id)
    .single();

  if (!project) throw new Error("Forbidden");

  await admin.from("milestones").delete().eq("id", milestoneId);

  revalidatePath(`/client/projects/${milestone.project_id}`);
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

  // Notify contractor that milestone was funded
  const { data: msData } = await admin
    .from("milestones")
    .select("title")
    .eq("id", milestoneId)
    .single();
  const msTitle = (msData as { title: string } | null)?.title ?? "A milestone";

  const { data: projTitle } = await admin
    .from("projects")
    .select("title")
    .eq("id", milestone.project_id)
    .single();
  const pTitle = (projTitle as { title: string } | null)?.title ?? "a project";

  if (project.contractor_id) {
    notify({
      userId: project.contractor_id,
      type: "milestone_funded",
      title: "Milestone Funded",
      body: `${msTitle} on ${pTitle} has been funded`,
      actionUrl: `/contractor/projects/${milestone.project_id}`,
    }).catch(() => {});
  }

  revalidatePath(`/client/projects/${milestone.project_id}`);

  return { clientSecret: paymentIntent.client_secret };
}

export async function startWork(
  milestoneId: string,
  checkInLat?: number,
  checkInLng?: number
) {
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

  // GPS proof-of-presence check-in
  let onSite: boolean | null = null;
  if (checkInLat !== undefined && checkInLng !== undefined) {
    const { data: onSiteResult } = await admin.rpc("check_on_site", {
      contractor_lat: checkInLat,
      contractor_long: checkInLng,
      p_project_id: milestone.project_id,
    });
    onSite = onSiteResult as boolean | null;

    await admin
      .from("milestones")
      .update({
        check_in_lat: checkInLat,
        check_in_lng: checkInLng,
        check_in_on_site: onSite ?? false,
        checked_in_at: new Date().toISOString(),
      })
      .eq("id", milestoneId);
  }

  // Notify client that work started
  const { data: startMsData } = await admin
    .from("milestones")
    .select("title")
    .eq("id", milestoneId)
    .single();
  const startMsTitle = (startMsData as { title: string } | null)?.title ?? "A milestone";

  const { data: startProjData } = await admin
    .from("projects")
    .select("client_id, title")
    .eq("id", milestone.project_id)
    .single();
  const startProj = startProjData as { client_id: string; title: string } | null;

  if (startProj) {
    notify({
      userId: startProj.client_id,
      type: "milestone_started",
      title: "Work Started",
      body: `Contractor started work on ${startMsTitle}`,
      actionUrl: `/client/projects/${milestone.project_id}`,
    }).catch(() => {});
  }

  revalidatePath(`/contractor/projects/${milestone.project_id}`);
  return { onSite };
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

  // Notify client that proof was submitted
  const { data: proofMsData } = await admin
    .from("milestones")
    .select("title")
    .eq("id", milestoneId)
    .single();
  const proofMsTitle = (proofMsData as { title: string } | null)?.title ?? "A milestone";

  const { data: proofProjData } = await admin
    .from("projects")
    .select("client_id")
    .eq("id", milestone.project_id)
    .single();
  const proofProj = proofProjData as { client_id: string } | null;

  if (proofProj) {
    notify({
      userId: proofProj.client_id,
      type: "milestone_proof",
      title: "Proof Submitted",
      body: `Contractor submitted proof for ${proofMsTitle}`,
      actionUrl: `/client/projects/${milestone.project_id}`,
    }).catch(() => {});
  }

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

  // Notify contractor that funds were released
  const { data: relMsData } = await admin
    .from("milestones")
    .select("title")
    .eq("id", milestoneId)
    .single();
  const relMsTitle = (relMsData as { title: string } | null)?.title ?? "A milestone";

  const { data: relProjData } = await admin
    .from("projects")
    .select("contractor_id")
    .eq("id", milestone.project_id)
    .single();
  const relProj = relProjData as { contractor_id: string | null } | null;

  if (relProj?.contractor_id) {
    notify({
      userId: relProj.contractor_id,
      type: "milestone_released",
      title: "Payment Released",
      body: `Payment released for ${relMsTitle}`,
      actionUrl: `/contractor/projects/${milestone.project_id}`,
    }).catch(() => {});
  }

  revalidatePath(`/client/projects/${milestone.project_id}`);
}
