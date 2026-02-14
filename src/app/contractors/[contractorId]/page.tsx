import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  ShieldCheck,
  MapPin,
  ArrowRight,
  Video,
} from "lucide-react";
import Link from "next/link";
import { SUBSCRIPTION_TIER_LABELS } from "@/lib/constants";
import type { SubscriptionTier } from "@/lib/types/database";

type ContractorProfile = {
  id: string;
  business_name: string;
  verified: boolean;
  subscription_tier: SubscriptionTier;
  specialties: string[] | null;
  service_area: string | null;
  bio: string | null;
  license_number: string | null;
  hype_video_playback_id: string | null;
};

export default async function ContractorPublicProfilePage({
  params,
}: {
  params: Promise<{ contractorId: string }>;
}) {
  const { contractorId } = await params;
  const supabase = await createClient();

  const { data: contractorData } = await supabase
    .from("contractors")
    .select("id, business_name, verified, subscription_tier, specialties, service_area, bio, license_number, hype_video_playback_id")
    .eq("id", contractorId)
    .single();

  if (!contractorData) notFound();

  const contractor = contractorData as unknown as ContractorProfile;

  const { data: profileData } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", contractorId)
    .single();

  const profile = profileData as {
    full_name: string;
    avatar_url: string | null;
  } | null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-brand-600" />
          <span className="text-lg font-bold text-brand-900">
            ConstructShield
          </span>
        </Link>
        <Button asChild>
          <Link href="/signup">Get Started</Link>
        </Button>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">
                {contractor.business_name}
              </CardTitle>
              <p className="text-muted-foreground">
                {profile?.full_name}
              </p>
            </div>
            <div className="flex gap-2">
              {contractor.verified && (
                <Badge className="bg-trust-green/10 text-trust-green">
                  <ShieldCheck className="mr-1 h-3 w-3" />
                  Verified
                </Badge>
              )}
              <Badge variant="outline">
                {SUBSCRIPTION_TIER_LABELS[contractor.subscription_tier]}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {contractor.bio && (
            <div>
              <h3 className="mb-2 font-semibold">About</h3>
              <p className="text-muted-foreground">{contractor.bio}</p>
            </div>
          )}

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            {contractor.service_area && (
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Service Area</p>
                  <p className="text-sm text-muted-foreground">
                    {contractor.service_area}
                  </p>
                </div>
              </div>
            )}
            {contractor.license_number && (
              <div>
                <p className="text-sm font-medium">License</p>
                <p className="text-sm text-muted-foreground">
                  {contractor.license_number}
                </p>
              </div>
            )}
          </div>

          {contractor.specialties && contractor.specialties.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="mb-2 font-semibold">Specialties</h3>
                <div className="flex flex-wrap gap-2">
                  {contractor.specialties.map((s) => (
                    <Badge key={s} variant="secondary">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Hype Gallery Placeholder */}
          {contractor.hype_video_playback_id ? (
            <>
              <Separator />
              <div>
                <h3 className="mb-2 font-semibold">Project Showcase</h3>
                <div className="aspect-video overflow-hidden rounded-lg bg-muted">
                  <video
                    src={`https://stream.mux.com/${contractor.hype_video_playback_id}.m3u8`}
                    controls
                    className="h-full w-full"
                    poster={`https://image.mux.com/${contractor.hype_video_playback_id}/thumbnail.webp`}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <Separator />
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center">
                <Video className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Video showcase coming soon
                </p>
              </div>
            </>
          )}

          <Separator />

          {/* CTA */}
          <div className="flex flex-col items-center gap-3 pt-2">
            <p className="text-center text-sm text-muted-foreground">
              Start a project with {contractor.business_name} — protected by
              ConstructShield escrow
            </p>
            <Button size="lg" asChild>
              <Link
                href={`/signup?contractor=${contractor.id}`}
              >
                Start a Project
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
