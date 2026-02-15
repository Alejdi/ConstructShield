import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { subscriptionTierKey } from "@/lib/i18n-constants";
import type { SubscriptionTier } from "@/lib/types/database";
import { getTranslations } from "next-intl/server";

export const metadata = {
  title: "Users - Admin - ConstructShield",
};

type UserRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
};

type ContractorRow = {
  id: string;
  verified: boolean;
  subscription_tier: SubscriptionTier | null;
};

export default async function AdminUsersPage() {
  const t = await getTranslations();
  const admin = getSupabaseAdmin();

  const [{ data: usersData }, { data: contractorsData }] = await Promise.all([
    admin
      .from("profiles")
      .select("id, full_name, avatar_url, role, created_at")
      .order("created_at", { ascending: false }),
    admin
      .from("contractors")
      .select("id, verified, subscription_tier"),
  ]);

  const users = (usersData ?? []) as UserRow[];
  const contractorMap = new Map(
    ((contractorsData ?? []) as ContractorRow[]).map((c) => [c.id, c])
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("admin.usersTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("admin.userCount", { count: users.length })}
        </p>
      </div>

      <div className="space-y-2">
        {users.map((user) => {
          const contractor = contractorMap.get(user.id);

          return (
            <Link
              key={user.id}
              href={`/admin/users/${user.id}`}
              className="flex items-center justify-between border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center border bg-muted text-xs font-bold uppercase">
                  {user.full_name?.charAt(0) ?? "?"}
                </div>
                <div>
                  <h3 className="font-medium">
                    {user.full_name ?? t("admin.unnamedUser")}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t("admin.joined", { date: formatDate(user.created_at) })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {contractor?.verified && (
                  <Badge variant="secondary">{t("contractor.verified")}</Badge>
                )}
                {contractor?.subscription_tier && (
                  <Badge variant="outline">
                    {t(subscriptionTierKey(contractor.subscription_tier))}
                  </Badge>
                )}
                <Badge
                  variant={
                    user.role === "admin"
                      ? "default"
                      : user.role === "contractor"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {user.role}
                </Badge>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
