"use server";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { notify } from "@/lib/notifications";
import { z } from "zod/v4";
import { createRateLimiter } from "@/lib/rate-limit";

const reviewLimiter = createRateLimiter({ maxRequests: 5, windowMs: 60_000 });

const submitReviewSchema = z.object({
  projectId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export type ReviewState = {
  error: string | null;
  success?: boolean;
};

export async function submitReview(
  _prevState: ReviewState,
  formData: FormData
): Promise<ReviewState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  try {
    reviewLimiter.check(user.id);
  } catch {
    return { error: "Too many requests. Please try again later." };
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const profile = profileData as { role: string } | null;
  if (profile?.role !== "client") {
    return { error: "Only clients can submit reviews" };
  }

  const parsed = submitReviewSchema.safeParse({
    projectId: formData.get("projectId"),
    rating: formData.get("rating"),
    comment: formData.get("comment") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Verify project belongs to client and is completed
  const { data: projectData } = await supabase
    .from("projects")
    .select("client_id, contractor_id, status")
    .eq("id", parsed.data.projectId)
    .single();

  const project = projectData as {
    client_id: string;
    contractor_id: string | null;
    status: string;
  } | null;

  if (!project || project.client_id !== user.id) {
    return { error: "Project not found" };
  }
  if (project.status !== "completed") {
    return { error: "Project must be completed before reviewing" };
  }
  if (!project.contractor_id) {
    return { error: "No contractor assigned to this project" };
  }

  // Check no existing review
  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id")
    .eq("project_id", parsed.data.projectId)
    .single();

  if (existingReview) {
    return { error: "You already reviewed this project" };
  }

  const { error } = await supabase.from("reviews").insert({
    project_id: parsed.data.projectId,
    client_id: user.id,
    contractor_id: project.contractor_id,
    rating: parsed.data.rating,
    comment: parsed.data.comment ?? null,
  });

  if (error) return { error: error.message };

  // Notify contractor about the new review
  const { data: projInfo } = await supabase
    .from("projects")
    .select("title")
    .eq("id", parsed.data.projectId)
    .single();
  const projTitle = (projInfo as { title: string } | null)?.title ?? "a project";

  notify({
    userId: project.contractor_id,
    type: "review_received",
    title: "New Review",
    body: `You received a ${parsed.data.rating}-star review on ${projTitle}`,
    actionUrl: `/contractors/${project.contractor_id}`,
  }).catch(() => {});

  revalidatePath(`/client/projects/${parsed.data.projectId}`);
  revalidatePath(`/contractors/${project.contractor_id}`);
  return { error: null, success: true };
}

export async function completeProject(projectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Verify project belongs to client
  const { data: projectData } = await supabase
    .from("projects")
    .select("client_id, status")
    .eq("id", projectId)
    .single();

  const project = projectData as {
    client_id: string;
    status: string;
  } | null;

  if (!project || project.client_id !== user.id) {
    throw new Error("Project not found");
  }
  if (project.status !== "active") {
    throw new Error("Project is not active");
  }

  // Verify all milestones are released
  const { data: milestones } = await supabase
    .from("milestones")
    .select("status")
    .eq("project_id", projectId);

  const allReleased =
    milestones &&
    milestones.length > 0 &&
    milestones.every(
      (m: { status: string }) => m.status === "released"
    );

  if (!allReleased) {
    throw new Error("All milestones must be released before completing");
  }

  // Fetch project details for notification
  const { data: projDetails } = await supabase
    .from("projects")
    .select("contractor_id, title")
    .eq("id", projectId)
    .single();
  const projDetail = projDetails as {
    contractor_id: string | null;
    title: string;
  } | null;

  await supabase
    .from("projects")
    .update({ status: "completed" })
    .eq("id", projectId)
    .eq("client_id", user.id);

  // Notify contractor that project is completed
  if (projDetail?.contractor_id) {
    notify({
      userId: projDetail.contractor_id,
      type: "project_completed",
      title: "Project Completed",
      body: `${projDetail.title} has been marked complete`,
      actionUrl: `/contractor/projects/${projectId}`,
    }).catch(() => {});

    // Recalculate reputation (completion rate changed)
    const admin = getSupabaseAdmin();
    admin.rpc("recalculate_reputation", {
      p_contractor_id: projDetail.contractor_id,
    }).catch(() => {});
  }

  revalidatePath(`/client/projects/${projectId}`);
}
