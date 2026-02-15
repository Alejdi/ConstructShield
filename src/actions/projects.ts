"use server";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod/v4";

const createProjectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  totalBudget: z.coerce.number().positive(),
  contractorId: z.string().uuid().optional(),
});

const updateProjectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  totalBudget: z.coerce.number().positive(),
});

export type ProjectState = {
  error: string | null;
};

export async function createProject(
  _prevState: ProjectState,
  formData: FormData
): Promise<ProjectState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const raw = {
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    totalBudget: formData.get("totalBudget"),
    contractorId: formData.get("contractorId") || undefined,
  };

  const parsed = createProjectSchema.safeParse(raw);
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

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      client_id: user.id,
      contractor_id: parsed.data.contractorId ?? null,
      title: parsed.data.title,
      description: parsed.data.description,
      total_budget: Math.round(parsed.data.totalBudget * 100),
      status: parsed.data.contractorId ? "active" : "draft",
      is_public: false,
      latitude,
      longitude,
      address,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  const projectId = (project as { id: string }).id;

  // Set PostGIS geography column
  if (latitude !== null && longitude !== null) {
    try {
      const admin = getSupabaseAdmin();
      await admin.rpc("update_project_location", {
        p_project_id: projectId,
        p_lat: latitude,
        p_long: longitude,
      });
    } catch {
      // Silently ignore location update failures
    }
  }

  redirect(`/client/projects/${projectId}`);
}

export async function publishProject(projectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data: project } = await supabase
    .from("projects")
    .select("status")
    .eq("id", projectId)
    .eq("client_id", user.id)
    .single();

  if (!project) throw new Error("Project not found");
  if ((project as { status: string }).status !== "draft") {
    throw new Error("Only draft projects can be published");
  }

  await supabase
    .from("projects")
    .update({ status: "bidding", is_public: true })
    .eq("id", projectId)
    .eq("client_id", user.id);

  revalidatePath(`/client/projects/${projectId}`);
}

export async function deleteProject(projectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data: project } = await supabase
    .from("projects")
    .select("status")
    .eq("id", projectId)
    .eq("client_id", user.id)
    .single();

  if (!project) throw new Error("Project not found");

  const status = (project as { status: string }).status;
  if (status !== "draft" && status !== "bidding") {
    throw new Error("Only draft or bidding projects can be deleted");
  }

  // Delete related data first, then the project itself (via admin to bypass RLS)
  const admin = getSupabaseAdmin();
  await admin.from("milestones").delete().eq("project_id", projectId);
  await admin.from("bids").delete().eq("project_id", projectId);
  await admin.from("project_images").delete().eq("project_id", projectId);

  const { error } = await admin
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("client_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/client");
}

export async function updateProject(
  projectId: string,
  _prevState: ProjectState,
  formData: FormData
): Promise<ProjectState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  // Verify ownership and editable status
  const { data: existing } = await supabase
    .from("projects")
    .select("status")
    .eq("id", projectId)
    .eq("client_id", user.id)
    .single();

  if (!existing) return { error: "Project not found" };

  const status = (existing as { status: string }).status;
  if (status !== "draft" && status !== "bidding") {
    return { error: "Only draft or bidding projects can be edited" };
  }

  const raw = {
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    totalBudget: formData.get("totalBudget"),
  };

  const parsed = updateProjectSchema.safeParse(raw);
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

  const admin = getSupabaseAdmin();

  const { error } = await admin
    .from("projects")
    .update({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      total_budget: Math.round(parsed.data.totalBudget * 100),
      latitude,
      longitude,
      address,
    })
    .eq("id", projectId)
    .eq("client_id", user.id);

  if (error) return { error: error.message };

  // Update PostGIS geography column
  await admin
    .rpc("update_project_location", {
      p_project_id: projectId,
      p_lat: latitude,
      p_long: longitude,
    })
    .catch(() => {});

  revalidatePath("/client");
  revalidatePath(`/client/projects/${projectId}`);
  return { error: null };
}

export async function updateProjectStatus(
  projectId: string,
  status: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  await supabase
    .from("projects")
    .update({ status })
    .eq("id", projectId)
    .eq("client_id", user.id);

  revalidatePath(`/client/projects/${projectId}`);
}
