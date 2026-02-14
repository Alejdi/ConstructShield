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
  const [isLoading, setIsLoading] = useState(false);

  async function handleFund() {
    setIsLoading(true);
    try {
      await fundMilestone(milestoneId);
      toast.success("Milestone funded! Funds are held in escrow.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to fund");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStartWork() {
    setIsLoading(true);
    try {
      await startWork(milestoneId);
      toast.success("Work started on this milestone.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRelease() {
    setIsLoading(true);
    try {
      await releaseFunds(milestoneId);
      toast.success("Funds released to contractor!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to release");
    } finally {
      setIsLoading(false);
    }
  }

  // Client actions
  if (role === "client") {
    if (status === "waiting_for_funds") {
      return (
        <Button onClick={handleFund} disabled={isLoading} size="sm">
          <DollarSign className="mr-1 h-4 w-4" />
          {isLoading ? "Funding..." : "Fund"}
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
                  <Eye className="mr-1 h-4 w-4" />
                  View Proof
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Proof Video</DialogTitle>
                  <DialogDescription>
                    Review the contractor&apos;s work before releasing funds
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
            <CheckCircle className="mr-1 h-4 w-4" />
            {isLoading ? "Releasing..." : "Release Funds"}
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
          <Play className="mr-1 h-4 w-4" />
          {isLoading ? "Starting..." : "Start Work"}
        </Button>
      );
    }

    if (status === "work_in_progress") {
      return (
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">
              <Video className="mr-1 h-4 w-4" />
              Upload Proof
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Proof Video</DialogTitle>
              <DialogDescription>
                Record or upload a video showing the completed work
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
