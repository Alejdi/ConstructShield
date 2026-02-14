import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ExternalLink } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "My Profile - ConstructShield",
};

export default async function ContractorProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single();

  const profile = profileData as {
    full_name: string;
    avatar_url: string | null;
  } | null;

  const { data: contractorData } = await supabase
    .from("contractors")
    .select("*")
    .eq("id", user.id)
    .single();

  const contractor = contractorData as {
    business_name: string;
    license_number: string | null;
    verified: boolean;
    subscription_tier: string;
    bio: string | null;
    specialties: string[] | null;
    service_area: string | null;
    stripe_connect_account_id: string | null;
  } | null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">
            How clients see your business
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/contractors/${user.id}`}>
            <ExternalLink className="mr-2 h-4 w-4" />
            View Public Profile
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{contractor?.business_name || "Not set"}</CardTitle>
              <CardDescription>{profile?.full_name}</CardDescription>
            </div>
            {contractor?.verified && (
              <Badge className="bg-trust-green/10 text-trust-green">
                <ShieldCheck className="mr-1 h-3 w-3" />
                Verified
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {contractor?.license_number && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                License Number
              </p>
              <p>{contractor.license_number}</p>
            </div>
          )}
          {contractor?.bio && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Bio</p>
              <p>{contractor.bio}</p>
            </div>
          )}
          {contractor?.specialties && contractor.specialties.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Specialties
              </p>
              <div className="mt-1 flex flex-wrap gap-2">
                {contractor.specialties.map((s) => (
                  <Badge key={s} variant="secondary">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {contractor?.service_area && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Service Area
              </p>
              <p>{contractor.service_area}</p>
            </div>
          )}

          <Button asChild>
            <Link href="/contractor/onboarding">Edit Profile</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
