"use server";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function deleteProjectImage(imageId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Fetch the image and verify ownership
  const { data: image } = await supabase
    .from("project_images")
    .select("id, project_id, storage_path, uploaded_by")
    .eq("id", imageId)
    .single();

  if (!image) {
    return { error: "Image not found" };
  }

  if (image.uploaded_by !== user.id) {
    return { error: "You can only delete your own images" };
  }

  const admin = getSupabaseAdmin();

  // Delete from storage
  const { error: storageError } = await admin.storage
    .from("project-images")
    .remove([image.storage_path]);

  if (storageError) {
    console.error("Storage delete error:", storageError);
    return { error: "Failed to delete image file" };
  }

  // Delete from database
  const { error: dbError } = await admin
    .from("project_images")
    .delete()
    .eq("id", imageId);

  if (dbError) {
    console.error("DB delete error:", dbError);
    return { error: "Failed to delete image record" };
  }

  revalidatePath(`/client/projects/${image.project_id}`);
  revalidatePath(`/contractor/projects/${image.project_id}`);

  return { success: true };
}
