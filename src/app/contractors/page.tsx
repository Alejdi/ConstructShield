import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, MapPin, ArrowRight } from "lucide-react";
import Link from "next/link";
import { SUBSCRIPTION_TIER_LABELS } from "@/lib/constants";
import type { SubscriptionTier } from "@/lib/types/database";

type ContractorListing = {
  id: string;
  business_name: string;
  verified: boolean;
  subscription_tier: SubscriptionTier;
  specialties: string[] | null;
  service_area: string | null;
  bio: string | null;
  profiles: { full_name: string; avatar_url: string | null };
};

export const metadata = {
  title: "Find Contractors - ConstructShield",
  description: "Browse verified construction contractors",
};

export default async function ContractorsDirectoryPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("contractors")
    .select("id, business_name, verified, subscription_tier, specialties, service_area, bio, profiles(full_name, avatar_url)")
    .order("verified", { ascending: false });

  const contractors = (data ?? []) as unknown as ContractorListing[];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Find Contractors</h1>
        <p className="mt-2 text-muted-foreground">
          Browse verified construction professionals protected by our escrow
          system
        </p>
      </div>

      {contractors.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">
            No contractors have signed up yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {contractors.map((contractor) => (
            <Card key={contractor.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {contractor.business_name || "Unnamed Business"}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {contractor.profiles?.full_name}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {contractor.verified && (
                      <Badge className="bg-trust-green/10 text-trust-green">
                        <ShieldCheck className="mr-1 h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3">
                {contractor.bio && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {contractor.bio}
                  </p>
                )}

                {contractor.service_area && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {contractor.service_area}
                  </div>
                )}

                {contractor.specialties && contractor.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {contractor.specialties.slice(0, 3).map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">
                        {s}
                      </Badge>
                    ))}
                    {contractor.specialties.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{contractor.specialties.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="mt-auto pt-3">
                  <Badge variant="outline" className="mb-3">
                    {SUBSCRIPTION_TIER_LABELS[contractor.subscription_tier]}
                  </Badge>
                  <Button asChild className="w-full">
                    <Link href={`/contractors/${contractor.id}`}>
                      View Profile
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
