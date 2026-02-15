import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import type { SubscriptionTier } from "@/lib/types/database";

const PRICE_MAP: Record<string, string | undefined> = {
  "basic_monthly": process.env.STRIPE_PRICE_BASIC_MONTHLY,
  "basic_yearly": process.env.STRIPE_PRICE_BASIC_YEARLY,
  "pro_monthly": process.env.STRIPE_PRICE_PRO_MONTHLY,
  "pro_yearly": process.env.STRIPE_PRICE_PRO_YEARLY,
  "elite_monthly": process.env.STRIPE_PRICE_ELITE_MONTHLY,
  "elite_yearly": process.env.STRIPE_PRICE_ELITE_YEARLY,
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const tier = body.tier as SubscriptionTier;
  const interval = body.interval as "monthly" | "yearly";

  if (!["basic", "pro", "elite"].includes(tier)) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }
  if (!["monthly", "yearly"].includes(interval)) {
    return NextResponse.json({ error: "Invalid interval" }, { status: 400 });
  }

  const priceId = PRICE_MAP[`${tier}_${interval}`];
  if (!priceId) {
    return NextResponse.json(
      { error: "Price not configured" },
      { status: 500 }
    );
  }

  // Get or create Stripe customer
  const { data: profileData } = await supabase
    .from("profiles")
    .select("stripe_customer_id, full_name")
    .eq("id", user.id)
    .single();

  const profile = profileData as {
    stripe_customer_id: string | null;
    full_name: string;
  } | null;

  let customerId = profile?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      name: profile?.full_name ?? undefined,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;

    const admin = getSupabaseAdmin();
    await admin
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  // Check if contractor already has a subscription (no trial if so)
  const { data: contractorData } = await supabase
    .from("contractors")
    .select("stripe_subscription_id")
    .eq("id", user.id)
    .single();

  const contractor = contractorData as {
    stripe_subscription_id: string | null;
  } | null;

  const hasPriorSubscription = !!contractor?.stripe_subscription_id;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      metadata: { contractor_id: user.id, tier },
      ...(!hasPriorSubscription ? { trial_period_days: 14 } : {}),
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/contractor/subscription?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/contractor/subscription`,
  });

  return NextResponse.json({ url: session.url });
}
