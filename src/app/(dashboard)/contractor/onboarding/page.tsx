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

const initialState: ProfileState = { error: null };

export default function ContractorOnboardingPage() {
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
        <h1 className="text-2xl font-bold">Contractor Onboarding</h1>
        <p className="text-muted-foreground">
          Complete your profile and connect payments
        </p>
      </div>

      {/* Stripe Connect */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Setup</CardTitle>
          <CardDescription>
            Connect your Stripe account to receive milestone payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="flex items-center gap-3 rounded-lg bg-trust-green/10 p-4">
              <CheckCircle className="h-5 w-5 text-trust-green" />
              <div>
                <p className="font-medium text-trust-green">
                  Stripe Connected Successfully
                </p>
                <p className="text-sm text-muted-foreground">
                  You can now receive milestone payments.
                </p>
              </div>
            </div>
          ) : (
            <Button onClick={handleConnectStripe} disabled={isConnecting}>
              <CreditCard className="mr-2 h-4 w-4" />
              {isConnecting ? "Connecting..." : "Connect Stripe Account"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Business Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Business Details</CardTitle>
          <CardDescription>
            Tell clients about your construction business
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
                Profile updated successfully!
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                name="businessName"
                placeholder="Smith Construction LLC"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="licenseNumber">License Number</Label>
              <Input
                id="licenseNumber"
                name="licenseNumber"
                placeholder="License #12345"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                placeholder="Tell clients about your experience and specialties..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialties">
                Specialties (comma-separated)
              </Label>
              <Input
                id="specialties"
                name="specialties"
                placeholder="Roofing, Framing, Electrical"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceArea">Service Area</Label>
              <Input
                id="serviceArea"
                name="serviceArea"
                placeholder="Greater Los Angeles Area"
              />
            </div>

            <Button type="submit" disabled={isProfilePending}>
              {isProfilePending ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
