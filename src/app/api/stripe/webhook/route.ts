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

    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription" && session.subscription) {
        const contractorId = session.metadata?.contractor_id;
        const tier = session.metadata?.tier;
        if (contractorId && tier) {
          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;

          await admin
            .from("contractors")
            .update({
              stripe_subscription_id: subscriptionId,
              subscription_tier: tier,
              subscription_status: "active",
            })
            .eq("id", contractorId);

          // Save customer ID on profile if not set
          if (session.customer) {
            const customerId =
              typeof session.customer === "string"
                ? session.customer
                : session.customer.id;
            await admin
              .from("profiles")
              .update({ stripe_customer_id: customerId })
              .eq("id", contractorId);
          }
        }
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const statusMap: Record<string, string> = {
        active: "active",
        past_due: "past_due",
        trialing: "trialing",
        canceled: "canceled",
        unpaid: "expired",
        incomplete_expired: "expired",
      };
      const mappedStatus = statusMap[subscription.status] ?? subscription.status;

      const periodEnd = subscription.items.data[0]?.current_period_end;

      await admin
        .from("contractors")
        .update({
          subscription_status: mappedStatus,
          ...(periodEnd
            ? { current_period_end: new Date(periodEnd * 1000).toISOString() }
            : {}),
        })
        .eq("stripe_subscription_id", subscription.id);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await admin
        .from("contractors")
        .update({
          subscription_status: "canceled",
          subscription_tier: "basic",
        })
        .eq("stripe_subscription_id", subscription.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
