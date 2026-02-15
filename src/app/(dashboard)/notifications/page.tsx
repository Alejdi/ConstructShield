import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BellOff } from "lucide-react";
import { NotificationsClient } from "@/components/notifications/notifications-client";
import type { NotificationType } from "@/lib/types/database";
import { getTranslations } from "next-intl/server";

type NotificationRow = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  action_url: string | null;
  read: boolean;
  created_at: string;
};

export const metadata = {
  title: "Notifications - ConstructShield",
};

export default async function NotificationsPage() {
  const t = await getTranslations();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase
    .from("notifications")
    .select("id, type, title, body, action_url, read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const notifications = (data ?? []) as unknown as NotificationRow[];

  // Group by date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups: { label: string; items: NotificationRow[] }[] = [];
  const todayItems: NotificationRow[] = [];
  const yesterdayItems: NotificationRow[] = [];
  const weekItems: NotificationRow[] = [];
  const olderItems: NotificationRow[] = [];

  for (const n of notifications) {
    const d = new Date(n.created_at);
    if (d >= today) todayItems.push(n);
    else if (d >= yesterday) yesterdayItems.push(n);
    else if (d >= weekAgo) weekItems.push(n);
    else olderItems.push(n);
  }

  if (todayItems.length > 0) groups.push({ label: t("notifications.today"), items: todayItems });
  if (yesterdayItems.length > 0) groups.push({ label: t("notifications.yesterday"), items: yesterdayItems });
  if (weekItems.length > 0) groups.push({ label: t("notifications.thisWeek"), items: weekItems });
  if (olderItems.length > 0) groups.push({ label: t("notifications.earlier"), items: olderItems });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("notifications.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("notifications.stayUpdated")}
        </p>
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-4 border-t py-16">
          <BellOff className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            {t("notifications.noNotifications")}
          </p>
        </div>
      ) : (
        <NotificationsClient groups={groups} />
      )}
    </div>
  );
}
