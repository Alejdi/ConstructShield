import { stripe } from "./client";

export async function createHold(params: {
  amount: number;
  customerId: string;
  connectedAccountId: string;
  milestoneId: string;
  projectId: string;
}) {
  const platformFee = Math.round(params.amount * 0.05);

  return stripe.paymentIntents.create({
    amount: params.amount,
    currency: "usd",
    customer: params.customerId,
    capture_method: "manual",
    transfer_data: {
      destination: params.connectedAccountId,
    },
    application_fee_amount: platformFee,
    metadata: {
      milestone_id: params.milestoneId,
      project_id: params.projectId,
    },
  });
}

export async function captureHold(paymentIntentId: string) {
  return stripe.paymentIntents.capture(paymentIntentId);
}

export async function cancelHold(paymentIntentId: string) {
  return stripe.paymentIntents.cancel(paymentIntentId);
}
