import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NotificationPreferences } from "@/components/notifications/notification-preferences";
import { PushToggle } from "@/components/notifications/push-toggle";
import { AvatarUpload } from "@/components/settings/avatar-upload";
import { getTranslations } from "next-intl/server";

export const metadata = {
  title: "Settings - ConstructShield",
};

export default async function SettingsPage() {
  const t = await getTranslations();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("full_name, role, avatar_url")
    .eq("id", user.id)
    .single();

  const profile = profileData as {
    full_name: string;
    role: string;
    avatar_url: string | null;
  } | null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  // Fetch notification preferences
  const { data: prefData } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const preferences = (prefData ?? {}) as Record<string, boolean>;

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
        <p className="text-muted-foreground">{t("settings.manageAccount")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.accountInfo")}</CardTitle>
          <CardDescription>{t("settings.accountInfoDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AvatarUpload
            currentAvatarUrl={profile?.avatar_url ?? null}
            fullName={profile?.full_name || ""}
            userId={user.id}
            supabaseUrl={supabaseUrl}
          />
          <div>
            <p className="text-sm font-medium text-muted-foreground">{t("auth.email")}</p>
            <p>{user.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{t("settings.name")}</p>
            <p>{profile?.full_name || t("common.notSet")}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{t("settings.role")}</p>
            <p className="capitalize">{profile?.role}</p>
          </div>
        </CardContent>
      </Card>

      {vapidPublicKey && (
        <Card>
          <CardHeader>
            <CardTitle>{t("notifications.pushNotifications")}</CardTitle>
            <CardDescription>
              {t("notifications.pushDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PushToggle vapidPublicKey={vapidPublicKey} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("notifications.preferences")}</CardTitle>
          <CardDescription>
            {t("notifications.preferencesDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationPreferences preferences={preferences} />
        </CardContent>
      </Card>
    </div>
  );
}
