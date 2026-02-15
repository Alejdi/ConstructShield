"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteProject } from "@/actions/projects";
import { toast } from "sonner";

interface DeleteProjectButtonProps {
  projectId: string;
  projectTitle: string;
}

export function DeleteProjectButton({
  projectId,
  projectTitle,
}: DeleteProjectButtonProps) {
  const t = useTranslations();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteProject(projectId);
      toast.success(t("projects.deletedMsg"));
      router.refresh();
    } catch {
      toast.error(t("projects.deleteFailed"));
    } finally {
      setDeleting(false);
      setOpen(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <Trash2 className="h-4 w-4 text-danger-red" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t("projects.deleteConfirm")}</DialogTitle>
            <DialogDescription>
              {t("projects.deleteConfirmDesc", { title: projectTitle })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={deleting}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? t("projects.deleting") : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
