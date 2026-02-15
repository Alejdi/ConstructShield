"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProjectForm } from "@/components/projects/project-form";
import { updateProject, type ProjectState } from "@/actions/projects";
import { toast } from "sonner";

type ProjectData = {
  id: string;
  title: string;
  description: string | null;
  total_budget: number;
  status: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
};

export default function EditProjectPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams<{ projectId: string }>();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data } = await supabase
        .from("projects")
        .select(
          "id, title, description, total_budget, status, latitude, longitude, address"
        )
        .eq("id", params.projectId)
        .single();
      setProject(data as ProjectData | null);
      setLoading(false);
    }
    load();
  }, [params.projectId]);

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        {t("common.loading")}
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        {t("projects.notFound")}
      </div>
    );
  }

  const boundAction = updateProject.bind(null, project.id);

  // Wrap the action to show toast and redirect on success
  async function handleAction(
    prevState: ProjectState,
    formData: FormData
  ): Promise<ProjectState> {
    const result = await boundAction(prevState, formData);
    if (!result.error) {
      toast.success(t("projects.savedMsg"));
      router.push(`/client/projects/${params.projectId}`);
    }
    return result;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t("projects.editProject")}</h1>
        <p className="text-muted-foreground">
          {t("projects.editProjectDesc")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("projects.projectDetails")}</CardTitle>
          <CardDescription>
            {t("projects.editDetails")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectForm
            action={handleAction}
            initialData={{
              title: project.title,
              description: project.description,
              totalBudget: project.total_budget,
              latitude: project.latitude,
              longitude: project.longitude,
              address: project.address,
            }}
            submitLabel={t("projects.saveChanges")}
            pendingLabel={t("projects.saving")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
