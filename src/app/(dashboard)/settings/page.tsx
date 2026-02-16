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
import { ThemeToggle } from "@/components/settings/theme-toggle";
import { ClientVerificationCard } from "@/components/verification/client-verification-card";
import { ContractorVerificationCard } from "@/components/verification/contractor-verification-card";
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
    .select("full_name, role, avatar_url, verification_status, id_document_type, verification_rejected_reason")
    .eq("id", user.id)
    .single();

  const profile = profileData as {
    full_name: string;
    role: string;
    avatar_url: string | null;
    verification_status: string;
    id_document_type: string | null;
    verification_rejected_reason: string | null;
  } | null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  // Fetch contractor verification data if contractor
  let contractorVerification: {
    verification_status: string;
    tax_id: string | null;
    verification_rejected_reason: string | null;
  } | null = null;

  if (profile?.role === "contractor") {
    const { data: contractorData } = await supabase
      .from("contractors")
      .select("verification_status, tax_id, verification_rejected_reason")
      .eq("id", user.id)
      .single();

    const cd = contractorData as Record<string, unknown> | null;
    if (cd) {
      contractorVerification = {
        verification_status: cd.verification_status as string,
        tax_id: (cd.tax_id as string) ?? null,
        verification_rejected_reason: (cd.verification_rejected_reason as string) ?? null,
      };
    }
  }

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

      {profile?.role === "client" && (
        <ClientVerificationCard
          verificationStatus={profile.verification_status}
          documentType={profile.id_document_type}
          rejectedReason={profile.verification_rejected_reason}
          userId={user.id}
          supabaseUrl={supabaseUrl}
        />
      )}

      {profile?.role === "contractor" && contractorVerification && (
        <ContractorVerificationCard
          verificationStatus={contractorVerification.verification_status}
          taxId={contractorVerification.tax_id}
          rejectedReason={contractorVerification.verification_rejected_reason}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.theme.title")}</CardTitle>
          <CardDescription>{t("settings.theme.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeToggle />
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
