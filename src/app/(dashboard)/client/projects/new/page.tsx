import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProjectForm } from "@/components/projects/project-form";
import { createProject } from "@/actions/projects";
import { getTranslations } from "next-intl/server";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export default async function NewProjectPage() {
  const t = await getTranslations();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("verification_status")
    .eq("id", user.id)
    .single();

  const profile = profileData as { verification_status: string } | null;

  if (profile?.verification_status !== "approved") {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{t("projects.createNew")}</h1>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <ShieldAlert className="mb-4 h-12 w-12 text-danger-red" />
            <h2 className="text-lg font-bold">
              {t("verification.requiredToCreateProject")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("verification.bannerUnverifiedClientDesc")}
            </p>
            <Link
              href="/settings"
              className="mt-6 inline-flex items-center bg-foreground px-6 py-3 text-xs font-medium uppercase tracking-[0.15em] text-background transition-colors hover:bg-foreground/90"
            >
              {t("verification.goToSettings")}
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t("projects.createNew")}</h1>
        <p className="text-muted-foreground">
          {t("projects.setupDetails")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("projects.projectDetails")}</CardTitle>
          <CardDescription>
            {t("projects.addMilestonesAfter")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectForm
            action={createProject}
            submitLabel={t("projects.createProject")}
            pendingLabel={t("projects.creating")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
