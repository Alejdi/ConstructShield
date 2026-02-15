"use server";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { captureHold, cancelHold } from "@/lib/stripe/escrow";
import { revalidatePath } from "next/cache";
import { notify } from "@/lib/notifications";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const admin = getSupabaseAdmin();
  const { data: profileData } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const profile = profileData as { role: string } | null;
  if (profile?.role !== "admin") throw new Error("Forbidden");

  return user;
}

export async function toggleContractorVerification(contractorId: string) {
  await requireAdmin();
  const admin = getSupabaseAdmin();

  const { data: contractor } = await admin
    .from("contractors")
    .select("verified")
    .eq("id", contractorId)
    .single();

  if (!contractor) throw new Error("Contractor not found");

  const newVerified = !(contractor as { verified: boolean }).verified;

  await admin
    .from("contractors")
    .update({ verified: newVerified })
    .eq("id", contractorId);

  revalidatePath(`/admin/users/${contractorId}`);
  revalidatePath("/admin/users");
}

export async function resolveDisputeRefund(projectId: string) {
  await requireAdmin();
  const admin = getSupabaseAdmin();

  const { data: project } = await admin
    .from("projects")
    .select("status, client_id, contractor_id, title")
    .eq("id", projectId)
    .single();

  const proj = project as {
    status: string;
    client_id: string;
    contractor_id: string | null;
    title: string;
  } | null;

  if (!proj || proj.status !== "disputed") {
    throw new Error("Project is not in disputed state");
  }

  // Cancel all held payment intents for this project's milestones
  const { data: milestones } = await admin
    .from("milestones")
    .select("id, status, stripe_payment_intent_id")
    .eq("project_id", projectId);

  const msArr = (milestones ?? []) as {
    id: string;
    status: string;
    stripe_payment_intent_id: string | null;
  }[];

  for (const ms of msArr) {
    if (
      ms.stripe_payment_intent_id &&
      ms.status !== "released"
    ) {
      try {
        await cancelHold(ms.stripe_payment_intent_id);
      } catch {
        // Payment intent may already be cancelled
      }
    }
  }

  // Mark project as completed (refunded)
  await admin
    .from("projects")
    .update({ status: "completed" })
    .eq("id", projectId);

  // Notify both parties
  if (proj.contractor_id) {
    notify({
      userId: proj.contractor_id,
      type: "project_completed",
      title: "Dispute Resolved",
      body: `${proj.title} dispute resolved — funds refunded to client`,
      actionUrl: `/contractor`,
    }).catch(() => {});
  }

  notify({
    userId: proj.client_id,
    type: "project_completed",
    title: "Dispute Resolved",
    body: `${proj.title} dispute resolved — funds will be refunded`,
    actionUrl: `/client`,
  }).catch(() => {});

  revalidatePath(`/admin/disputes`);
  revalidatePath(`/admin`);
}

export async function resolveDisputeRelease(projectId: string) {
  await requireAdmin();
  const admin = getSupabaseAdmin();

  const { data: project } = await admin
    .from("projects")
    .select("status, client_id, contractor_id, title")
    .eq("id", projectId)
    .single();

  const proj = project as {
    status: string;
    client_id: string;
    contractor_id: string | null;
    title: string;
  } | null;

  if (!proj || proj.status !== "disputed") {
    throw new Error("Project is not in disputed state");
  }

  // Capture all held payment intents for this project's milestones
  const { data: milestones } = await admin
    .from("milestones")
    .select("id, status, stripe_payment_intent_id")
    .eq("project_id", projectId);

  const msArr = (milestones ?? []) as {
    id: string;
    status: string;
    stripe_payment_intent_id: string | null;
  }[];

  for (const ms of msArr) {
    if (
      ms.stripe_payment_intent_id &&
      ms.status !== "released"
    ) {
      try {
        await captureHold(ms.stripe_payment_intent_id);
        await admin
          .from("milestones")
          .update({ status: "released" })
          .eq("id", ms.id);
      } catch {
        // Payment intent may already be captured
      }
    }
  }

  // Mark project as completed
  await admin
    .from("projects")
    .update({ status: "completed" })
    .eq("id", projectId);

  // Notify both parties
  if (proj.contractor_id) {
    notify({
      userId: proj.contractor_id,
      type: "project_completed",
      title: "Dispute Resolved",
      body: `${proj.title} dispute resolved — funds released to you`,
      actionUrl: `/contractor`,
    }).catch(() => {});
  }

  notify({
    userId: proj.client_id,
    type: "project_completed",
    title: "Dispute Resolved",
    body: `${proj.title} dispute resolved — funds released to contractor`,
    actionUrl: `/client`,
  }).catch(() => {});

  revalidatePath(`/admin/disputes`);
  revalidatePath(`/admin`);
}
