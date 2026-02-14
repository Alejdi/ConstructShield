"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod/v4";

const createProjectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  totalBudget: z.coerce.number().positive(),
  contractorId: z.string().uuid().optional(),
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

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      client_id: user.id,
      contractor_id: parsed.data.contractorId ?? null,
      title: parsed.data.title,
      description: parsed.data.description,
      total_budget: Math.round(parsed.data.totalBudget * 100),
      status: parsed.data.contractorId ? "active" : "bidding",
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  redirect(`/client/projects/${(project as { id: string }).id}`);
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
