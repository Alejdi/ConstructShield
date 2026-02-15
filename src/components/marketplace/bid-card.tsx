"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { acceptBid, rejectBid } from "@/actions/bids";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { BID_STATUS_COLORS } from "@/lib/constants";
import { bidStatusKey } from "@/lib/i18n-constants";
import { CheckCircle } from "lucide-react";
import type { BidStatus } from "@/lib/types/database";

interface BidCardProps {
  id: string;
  amount: number;
  message: string | null;
  status: BidStatus;
  createdAt: string;
  contractorName: string;
  businessName: string;
  verified: boolean;
  specialties: string[] | null;
  isProjectOwner: boolean;
}

export function BidCard({
  id,
  amount,
  message,
  status,
  createdAt,
  contractorName,
  businessName,
  verified,
  specialties,
  isProjectOwner,
}: BidCardProps) {
  const t = useTranslations();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  async function handleAccept() {
    setIsAccepting(true);
    try {
      await acceptBid(id);
    } catch {
      setIsAccepting(false);
    }
  }

  async function handleReject() {
    setIsRejecting(true);
    try {
      await rejectBid(id);
    } catch {
      setIsRejecting(false);
    }
  }

  return (
    <div className="border p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">{businessName}</p>
            {verified && (
              <CheckCircle className="h-3.5 w-3.5 text-trust-green" />
            )}
            <Badge className={BID_STATUS_COLORS[status]}>
              {t(bidStatusKey(status))}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {contractorName} &middot; {formatRelativeTime(createdAt)}
          </p>
          {specialties && specialties.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {specialties.map((s) => (
                <span
                  key={s}
                  className="bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
          {message && (
            <p className="mt-3 text-sm text-muted-foreground">{message}</p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-bold">{formatCurrency(amount)}</p>
          {isProjectOwner && status === "pending" && (
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                onClick={handleAccept}
                disabled={isAccepting || isRejecting}
              >
                {isAccepting ? t("bids.accepting") : t("bids.acceptBid")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReject}
                disabled={isAccepting || isRejecting}
                className="text-danger-red hover:bg-danger-red/10"
              >
                {isRejecting ? t("bids.rejecting") : t("bids.rejectBid")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
