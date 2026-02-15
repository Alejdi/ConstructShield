"use client";

import { useState } from "react";
import { publishProject } from "@/actions/projects";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface PublishProjectButtonProps {
  projectId: string;
}

export function PublishProjectButton({
  projectId,
}: PublishProjectButtonProps) {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);

  async function handlePublish() {
    setIsLoading(true);
    try {
      await publishProject(projectId);
      toast.success(t("projects.publishedMsg"));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("projects.publishFailed")
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button onClick={handlePublish} disabled={isLoading}>
      <Send className="me-2 h-4 w-4" />
      {isLoading ? t("projects.publishing") : t("projects.publish")}
    </Button>
  );
}
