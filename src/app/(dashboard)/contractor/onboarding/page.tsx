"use client";

import { useState } from "react";
import { useActionState } from "react";
import {
  updateContractorProfile,
  type ProfileState,
} from "@/actions/profiles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreditCard, CheckCircle } from "lucide-react";
import { LocationPicker } from "@/components/location/location-picker";
import { useTranslations } from "next-intl";

const initialState: ProfileState = { error: null };

export default function ContractorOnboardingPage() {
  const t = useTranslations();
  const [profileState, profileAction, isProfilePending] = useActionState(
    updateContractorProfile,
    initialState
  );
  const [isConnecting, setIsConnecting] = useState(false);

  async function handleConnectStripe() {
    setIsConnecting(true);
    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setIsConnecting(false);
    }
  }

  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;
  const isSuccess = searchParams?.get("success") === "true";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("contractor.onboarding")}</h1>
        <p className="text-muted-foreground">
          {t("contractor.completeProfile")}
        </p>
      </div>

      {/* Stripe Connect */}
      <Card>
        <CardHeader>
          <CardTitle>{t("contractor.paymentSetup")}</CardTitle>
          <CardDescription>
            {t("contractor.connectPaymentDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="flex items-center gap-3 rounded-lg bg-trust-green/10 p-4">
              <CheckCircle className="h-5 w-5 text-trust-green" />
              <div>
                <p className="font-medium text-trust-green">
                  {t("contractor.stripeConnected")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("contractor.canReceivePayments")}
                </p>
              </div>
            </div>
          ) : (
            <Button onClick={handleConnectStripe} disabled={isConnecting}>
              <CreditCard className="me-2 h-4 w-4" />
              {isConnecting ? t("contractor.connecting") : t("contractor.connectStripeAccount")}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Business Profile */}
      <Card>
        <CardHeader>
          <CardTitle>{t("contractor.businessDetails")}</CardTitle>
          <CardDescription>
            {t("contractor.businessDetailsDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={profileAction} className="space-y-4">
            {profileState.error && (
              <div className="rounded-md bg-danger-red/10 p-3 text-sm text-danger-red">
                {profileState.error}
              </div>
            )}
            {profileState.success && (
              <div className="rounded-md bg-trust-green/10 p-3 text-sm text-trust-green">
                {t("contractor.profileUpdated")}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="businessName">{t("contractor.businessName")}</Label>
              <Input
                id="businessName"
                name="businessName"
                placeholder={t("contractor.businessNamePlaceholder")}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="licenseNumber">{t("contractor.licenseNumber")}</Label>
              <Input
                id="licenseNumber"
                name="licenseNumber"
                placeholder={t("contractor.licenseNumberPlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">{t("contractor.bio")}</Label>
              <Textarea
                id="bio"
                name="bio"
                placeholder={t("contractor.bioPlaceholder")}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialties">
                {t("contractor.specialties")}
              </Label>
              <Input
                id="specialties"
                name="specialties"
                placeholder={t("contractor.specialtiesPlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceArea">{t("contractor.serviceArea")}</Label>
              <Input
                id="serviceArea"
                name="serviceArea"
                placeholder={t("contractor.serviceAreaPlaceholder")}
              />
            </div>

            <LocationPicker required />

            <Button type="submit" disabled={isProfilePending}>
              {isProfilePending ? t("services.saving") : t("contractor.saveProfile")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
