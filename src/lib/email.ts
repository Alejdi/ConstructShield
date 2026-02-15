import "server-only";

import { Resend } from "resend";

let resendInstance: Resend | null = null;

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  if (!resendInstance) {
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

const FROM_ADDRESS =
  process.env.RESEND_FROM_ADDRESS ?? "ConstructShield <noreply@constructshield.com>";

interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  actionUrl?: string;
}

export async function sendNotificationEmail({
  to,
  subject,
  body,
  actionUrl,
}: SendEmailParams): Promise<void> {
  const resend = getResend();
  if (!resend) return; // Email not configured — skip silently

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://constructshield.com";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f8f8f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f8f8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border:1px solid #e5e5e5;">
          <!-- Header -->
          <tr>
            <td style="padding:24px 32px;border-bottom:1px solid #e5e5e5;">
              <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.3em;color:#000000;">
                ConstructShield
              </span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 16px;font-size:18px;font-weight:700;color:#000000;">
                ${subject}
              </h2>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#555555;">
                ${body}
              </p>
              ${
                actionUrl
                  ? `<a href="${appUrl}${actionUrl}" style="display:inline-block;padding:12px 24px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.15em;color:#ffffff;background-color:#000000;text-decoration:none;">View Details</a>`
                  : ""
              }
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #e5e5e5;">
              <p style="margin:0;font-size:11px;color:#999999;">
                You received this email because of your notification settings on ConstructShield.
                <a href="${appUrl}/settings" style="color:#999999;">Manage preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    });
  } catch {
    // Log but don't throw — email is best-effort
    console.error(`[email] Failed to send to ${to}`);
  }
}
