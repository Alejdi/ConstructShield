import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PushPrompt } from "@/components/notifications/push-prompt";
import type { UserRole } from "@/lib/types/database";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("role, full_name, avatar_url")
    .eq("id", user.id)
    .single();

  const profile = profileData as {
    role: string;
    full_name: string;
    avatar_url: string | null;
  } | null;

  if (!profile) {
    redirect("/login");
  }

  const role = profile.role as UserRole;
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          fullName={profile.full_name}
          avatarUrl={profile.avatar_url}
          role={role}
          userId={user.id}
        />
        <main className="flex-1 overflow-y-auto p-4 pb-20 lg:p-6 lg:pb-6">
          {vapidPublicKey && <PushPrompt vapidPublicKey={vapidPublicKey} />}
          {children}
        </main>
      </div>
      <BottomNav role={role} />
    </div>
  );
}
