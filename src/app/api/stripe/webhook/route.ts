import { stripe } from "@/lib/stripe/client";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  switch (event.type) {
    case "payment_intent.amount_capturable_updated": {
      const pi = event.data.object as Stripe.PaymentIntent;
      const milestoneId = pi.metadata.milestone_id;
      if (milestoneId) {
        await admin
          .from("milestones")
          .update({ stripe_payment_intent_id: pi.id })
          .eq("id", milestoneId);
      }
      break;
    }

    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      const milestoneId = pi.metadata.milestone_id;
      if (milestoneId) {
        await admin
          .from("milestones")
          .update({
            status: "released",
            released_at: new Date().toISOString(),
          })
          .eq("id", milestoneId)
          .eq("status", "verification_pending");
      }
      break;
    }

    case "account.updated": {
      const account = event.data.object as Stripe.Account;
      if (account.charges_enabled) {
        await admin
          .from("contractors")
          .update({ verified: true })
          .eq("stripe_connect_account_id", account.id);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
