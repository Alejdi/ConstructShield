import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendNotificationEmail } from "@/lib/email";
import { sendPushNotification } from "@/lib/web-push";
import type { NotificationType } from "@/lib/types/database";

interface NotifyParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  actionUrl?: string;
  data?: Record<string, unknown>;
}

export async function notify({
  userId,
  type,
  title,
  body,
  actionUrl,
  data,
}: NotifyParams): Promise<void> {
  const admin = getSupabaseAdmin();

  // Check user preference for this notification type
  const { data: prefData } = await admin
    .from("notification_preferences")
    .select(`${type}, email_enabled, push_enabled`)
    .eq("user_id", userId)
    .single();

  const prefs = prefData as Record<string, boolean> | null;

  // If preferences exist and this type is disabled, skip entirely
  if (prefs && prefs[type] === false) {
    return;
  }

  // Insert in-app notification
  await admin.from("notifications").insert({
    user_id: userId,
    type,
    title,
    body,
    action_url: actionUrl ?? null,
    data: data ?? {},
  });

  // Send email if enabled (default: true)
  const emailEnabled = prefs?.email_enabled !== false;
  if (emailEnabled) {
    // Fetch user email from auth
    const { data: authData } = await admin.auth.admin.getUserById(userId);
    const email = authData?.user?.email;

    if (email) {
      sendNotificationEmail({
        to: email,
        subject: title,
        body,
        actionUrl,
      }).catch(() => {});
    }
  }

  // Send push notification if enabled
  const pushEnabled = prefs?.push_enabled === true;
  if (pushEnabled) {
    const { data: subs } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", userId);

    const subscriptions = subs as
      | { id: string; endpoint: string; p256dh: string; auth: string }[]
      | null;

    if (subscriptions && subscriptions.length > 0) {
      const pushPayload = { title, body, url: actionUrl ?? "/" };

      await Promise.allSettled(
        subscriptions.map(async (sub) => {
          const success = await sendPushNotification(sub, pushPayload);
          // Remove stale subscriptions (410 Gone / 404)
          if (!success) {
            await admin
              .from("push_subscriptions")
              .delete()
              .eq("id", sub.id)
              .catch(() => {});
          }
        })
      );
    }
  }
}
