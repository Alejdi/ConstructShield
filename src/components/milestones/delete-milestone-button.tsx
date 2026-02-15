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
import { deleteMilestone } from "@/actions/milestones";
import { toast } from "sonner";

interface DeleteMilestoneButtonProps {
  milestoneId: string;
  milestoneTitle: string;
}

export function DeleteMilestoneButton({
  milestoneId,
  milestoneTitle,
}: DeleteMilestoneButtonProps) {
  const t = useTranslations();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteMilestone(milestoneId);
      toast.success(t("milestones.deletedMsg"));
      router.refresh();
    } catch {
      toast.error(t("milestones.deleteFailed"));
    } finally {
      setDeleting(false);
      setOpen(false);
    }
  }

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4 text-danger-red" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t("milestones.deleteConfirm")}</DialogTitle>
            <DialogDescription>
              {t("milestones.deleteConfirmDesc", { title: milestoneTitle })}
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
              {deleting ? t("milestones.deleting") : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
