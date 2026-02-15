"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markAsRead(notificationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  revalidatePath("/notifications");
}

export async function markAllAsRead() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);

  revalidatePath("/notifications");
}

export type PreferencesState = {
  error: string | null;
  success?: boolean;
};

export async function updateNotificationPreferences(
  _prevState: PreferencesState,
  formData: FormData
): Promise<PreferencesState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const preferences = {
    user_id: user.id,
    bid_received: formData.get("bid_received") === "on",
    bid_accepted: formData.get("bid_accepted") === "on",
    bid_rejected: formData.get("bid_rejected") === "on",
    milestone_funded: formData.get("milestone_funded") === "on",
    milestone_started: formData.get("milestone_started") === "on",
    milestone_proof: formData.get("milestone_proof") === "on",
    milestone_released: formData.get("milestone_released") === "on",
    message_received: formData.get("message_received") === "on",
    project_completed: formData.get("project_completed") === "on",
    review_received: formData.get("review_received") === "on",
    dispute_opened: formData.get("dispute_opened") === "on",
    email_enabled: formData.get("email_enabled") === "on",
  };

  // Upsert: insert if not exists, update if exists
  const { data: existing } = await supabase
    .from("notification_preferences")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("notification_preferences")
      .update(preferences)
      .eq("user_id", user.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("notification_preferences")
      .insert(preferences);
    if (error) return { error: error.message };
  }

  revalidatePath("/settings");
  return { error: null, success: true };
}
