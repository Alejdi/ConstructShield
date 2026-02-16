"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Loader2, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { submitContractorVerification, type VerificationState } from "@/actions/verification";

interface ContractorVerificationCardProps {
  verificationStatus: string;
  taxId: string | null;
  rejectedReason: string | null;
}

export function ContractorVerificationCard({
  verificationStatus,
  taxId,
  rejectedReason,
}: ContractorVerificationCardProps) {
  const t = useTranslations("verification");
  const router = useRouter();

  const [state, formAction, isPending] = useActionState<VerificationState, FormData>(
    async (_prevState: VerificationState, formData: FormData) => {
      const result = await submitContractorVerification(_prevState, formData);
      if (result.success) {
        toast.success(t("submitted"));
        router.refresh();
      } else if (result.error) {
        toast.error(result.error);
      }
      return result;
    },
    { error: null, success: false }
  );

  // Approved state
  if (verificationStatus === "approved") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-trust-green" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("approvedMessage")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Pending state
  if (verificationStatus === "pending") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-warning-amber" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("pendingMessage")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Unverified or rejected — show form
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("contractorTitle")}</CardTitle>
        <CardDescription>{t("contractorDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        {verificationStatus === "rejected" && rejectedReason && (
          <div className="mb-4 flex items-start gap-3 border border-danger-red/30 p-4">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger-red" />
            <div>
              <p className="text-sm font-medium">{t("rejectedMessage")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("rejectedReason", { reason: rejectedReason })}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{t("canResubmit")}</p>
            </div>
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="taxId">{t("taxId")}</Label>
            <Input
              id="taxId"
              name="taxId"
              placeholder={t("taxIdPlaceholder")}
              defaultValue={taxId ?? ""}
              required
              minLength={5}
              maxLength={50}
            />
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {t("submitting")}
              </>
            ) : verificationStatus === "rejected" ? (
              t("resubmit")
            ) : (
              t("submit")
            )}
          </Button>

          {state.error && (
            <p className="text-sm text-danger-red">{state.error}</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
