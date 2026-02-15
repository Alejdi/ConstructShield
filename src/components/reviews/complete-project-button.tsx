"use client";

import { useState } from "react";
import { completeProject } from "@/actions/reviews";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface CompleteProjectButtonProps {
  projectId: string;
}

export function CompleteProjectButton({
  projectId,
}: CompleteProjectButtonProps) {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);

  async function handleComplete() {
    setIsLoading(true);
    try {
      await completeProject(projectId);
      toast.success(t("projects.completedMsg"));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("projects.completeFailed")
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button onClick={handleComplete} disabled={isLoading}>
      <CheckCircle className="me-2 h-4 w-4" />
      {isLoading ? t("projects.completing") : t("projects.completeProject")}
    </Button>
  );
}
