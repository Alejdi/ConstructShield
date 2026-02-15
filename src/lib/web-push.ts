import "server-only";

import webPush from "web-push";

let configured = false;

function ensureConfigured() {
  if (configured) return;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:hello@constructshield.com";

  if (!publicKey || !privateKey) {
    throw new Error(
      "VAPID keys not set. Generate with: npx web-push generate-vapid-keys"
    );
  }

  webPush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
): Promise<boolean> {
  ensureConfigured();

  try {
    await webPush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload)
    );
    return true;
  } catch (err: unknown) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    // 410 Gone or 404 means the subscription is no longer valid
    if (statusCode === 410 || statusCode === 404) {
      return false; // caller should remove subscription
    }
    return false;
  }
}
