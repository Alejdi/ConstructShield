"use client";

import { createProject } from "@/actions/projects";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProjectForm } from "@/components/projects/project-form";
import { useTranslations } from "next-intl";

export default function NewProjectPage() {
  const t = useTranslations();

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
