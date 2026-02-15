"use server";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { notify } from "@/lib/notifications";

export async function openDispute(projectId: string, reason: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const trimmedReason = reason.trim();
  if (!trimmedReason || trimmedReason.length < 10) {
    throw new Error("Please provide a reason with at least 10 characters");
  }

  const admin = getSupabaseAdmin();

  // Fetch the project
  const { data: projectData } = await admin
    .from("projects")
    .select("id, status, client_id, contractor_id, title")
    .eq("id", projectId)
    .single();

  const project = projectData as {
    id: string;
    status: string;
    client_id: string;
    contractor_id: string | null;
    title: string;
  } | null;

  if (!project) throw new Error("Project not found");
  if (project.status !== "active") {
    throw new Error("Only active projects can be disputed");
  }

  // Verify caller is a participant
  const isClient = project.client_id === user.id;
  const isContractor = project.contractor_id === user.id;
  if (!isClient && !isContractor) {
    throw new Error("Unauthorized");
  }

  // Insert dispute record
  await admin.from("disputes").insert({
    project_id: projectId,
    opened_by: user.id,
    reason: trimmedReason,
  });

  // Transition project to disputed
  await admin
    .from("projects")
    .update({ status: "disputed" })
    .eq("id", projectId);

  // Notify the other party
  const otherPartyId = isClient
    ? project.contractor_id
    : project.client_id;

  if (otherPartyId) {
    const actionUrl = isClient
      ? `/contractor/projects/${projectId}`
      : `/client/projects/${projectId}`;

    notify({
      userId: otherPartyId,
      type: "dispute_opened",
      title: "Dispute Opened",
      body: `A dispute has been opened on "${project.title}"`,
      actionUrl,
    }).catch(() => {});
  }

  // Recalculate contractor reputation (dispute affects completion rate)
  if (project.contractor_id) {
    admin.rpc("recalculate_reputation", {
      p_contractor_id: project.contractor_id,
    }).catch(() => {});
  }

  revalidatePath(`/client/projects/${projectId}`);
  revalidatePath(`/contractor/projects/${projectId}`);
  revalidatePath(`/admin/disputes`);
  revalidatePath(`/admin`);
}
