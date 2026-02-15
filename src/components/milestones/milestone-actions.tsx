"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  fundMilestone,
  startWork,
  releaseFunds,
} from "@/actions/milestones";
import { toast } from "sonner";
import type { MilestoneStatus } from "@/lib/types/database";
import {
  DollarSign,
  Play,
  CheckCircle,
  Video,
  Eye,
} from "lucide-react";
import { VideoUploader } from "@/components/video/video-uploader";
import { useTranslations } from "next-intl";

interface MilestoneActionsProps {
  milestoneId: string;
  status: MilestoneStatus;
  role: "client" | "contractor";
  proofVideoUrl: string | null;
}

export function MilestoneActions({
  milestoneId,
  status,
  role,
  proofVideoUrl,
}: MilestoneActionsProps) {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);

  async function handleFund() {
    setIsLoading(true);
    try {
      await fundMilestone(milestoneId);
      toast.success(t("milestones.fundedMsg"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("milestones.fundFailed"));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStartWork() {
    setIsLoading(true);
    try {
      // Request GPS for proof-of-presence check-in
      let checkInLat: number | undefined;
      let checkInLng: number | undefined;

      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>(
            (resolve, reject) =>
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
              })
          );
          checkInLat = position.coords.latitude;
          checkInLng = position.coords.longitude;
        } catch {
          // Location denied — proceed without check-in
        }
      }

      const result = await startWork(milestoneId, checkInLat, checkInLng);
      if (result?.onSite === false) {
        toast.success(t("milestones.startedAway"));
      } else {
        toast.success(t("milestones.startedMsg"));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("milestones.startFailed"));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRelease() {
    setIsLoading(true);
    try {
      await releaseFunds(milestoneId);
      toast.success(t("milestones.releasedMsg"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("milestones.releaseFailed"));
    } finally {
      setIsLoading(false);
    }
  }

  // Client actions
  if (role === "client") {
    if (status === "waiting_for_funds") {
      return (
        <Button onClick={handleFund} disabled={isLoading} size="sm">
          <DollarSign className="me-1 h-4 w-4" />
          {isLoading ? t("milestones.funding") : t("milestones.fund")}
        </Button>
      );
    }

    if (status === "verification_pending") {
      return (
        <div className="flex items-center gap-2">
          {proofVideoUrl && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="me-1 h-4 w-4" />
                  {t("milestones.viewProof")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{t("milestones.proofVideo")}</DialogTitle>
                  <DialogDescription>
                    {t("milestones.proofReview")}
                  </DialogDescription>
                </DialogHeader>
                <div className="aspect-video rounded-lg bg-muted">
                  <video
                    src={proofVideoUrl}
                    controls
                    className="h-full w-full rounded-lg"
                  />
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Button
            onClick={handleRelease}
            disabled={isLoading}
            size="sm"
            className="bg-trust-green hover:bg-trust-green/90"
          >
            <CheckCircle className="me-1 h-4 w-4" />
            {isLoading ? t("milestones.releasing") : t("milestones.releaseFunds")}
          </Button>
        </div>
      );
    }

    return null;
  }

  // Contractor actions
  if (role === "contractor") {
    if (status === "funded") {
      return (
        <Button onClick={handleStartWork} disabled={isLoading} size="sm">
          <Play className="me-1 h-4 w-4" />
          {isLoading ? t("milestones.starting") : t("milestones.startWork")}
        </Button>
      );
    }

    if (status === "work_in_progress") {
      return (
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">
              <Video className="me-1 h-4 w-4" />
              {t("milestones.uploadProof")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("milestones.uploadProofVideo")}</DialogTitle>
              <DialogDescription>
                {t("milestones.uploadProofDesc")}
              </DialogDescription>
            </DialogHeader>
            <VideoUploader type="proof" referenceId={milestoneId} />
          </DialogContent>
        </Dialog>
      );
    }

    return null;
  }

  return null;
}
