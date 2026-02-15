import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  const profile = profileData as { stripe_customer_id: string | null } | null;

  if (!profile?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No billing account found" },
      { status: 400 }
    );
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/contractor/subscription`,
  });

  return NextResponse.json({ url: session.url });
}
