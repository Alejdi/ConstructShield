"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import {
  updateNotificationPreferences,
  type PreferencesState,
} from "@/actions/notifications";
import { Button } from "@/components/ui/button";
import { CheckCircle, Mail } from "lucide-react";

interface PreferenceToggle {
  key: string;
  labelKey: string;
  descKey: string;
}

const PREFERENCE_TOGGLES: PreferenceToggle[] = [
  {
    key: "bid_received",
    labelKey: "notifications.bidReceived",
    descKey: "notifications.bidReceivedDesc",
  },
  {
    key: "bid_accepted",
    labelKey: "notifications.bidAccepted",
    descKey: "notifications.bidAcceptedDesc",
  },
  {
    key: "bid_rejected",
    labelKey: "notifications.bidNotSelected",
    descKey: "notifications.bidNotSelectedDesc",
  },
  {
    key: "milestone_funded",
    labelKey: "notifications.milestoneFunded",
    descKey: "notifications.milestoneFundedDesc",
  },
  {
    key: "milestone_started",
    labelKey: "notifications.workStarted",
    descKey: "notifications.workStartedDesc",
  },
  {
    key: "milestone_proof",
    labelKey: "notifications.proofSubmitted",
    descKey: "notifications.proofSubmittedDesc",
  },
  {
    key: "milestone_released",
    labelKey: "notifications.paymentReleased",
    descKey: "notifications.paymentReleasedDesc",
  },
  {
    key: "message_received",
    labelKey: "notifications.newMessage",
    descKey: "notifications.newMessageDesc",
  },
  {
    key: "project_completed",
    labelKey: "notifications.projectCompleted",
    descKey: "notifications.projectCompletedDesc",
  },
  {
    key: "review_received",
    labelKey: "notifications.newReview",
    descKey: "notifications.newReviewDesc",
  },
  {
    key: "dispute_opened",
    labelKey: "notifications.disputeOpened",
    descKey: "notifications.disputeOpenedDesc",
  },
];

interface NotificationPreferencesProps {
  preferences: Record<string, boolean>;
}

const initialState: PreferencesState = { error: null };

export function NotificationPreferences({
  preferences,
}: NotificationPreferencesProps) {
  const t = useTranslations();
  const [state, formAction, isPending] = useActionState(
    updateNotificationPreferences,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-md bg-danger-red/10 p-3 text-sm text-danger-red">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="flex items-center gap-2 rounded-md bg-trust-green/10 p-3 text-sm text-trust-green">
          <CheckCircle className="h-4 w-4" />
          {t("notifications.preferencesSaved")}
        </div>
      )}

      {/* Email toggle */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">{t("notifications.emailNotifications")}</p>
            <p className="text-xs text-muted-foreground">
              {t("notifications.emailNotificationsDesc")}
            </p>
          </div>
        </div>
        <input
          type="checkbox"
          name="email_enabled"
          defaultChecked={preferences.email_enabled !== false}
          className="h-4 w-4 accent-foreground"
        />
      </div>

      <div className="divide-y">
        {PREFERENCE_TOGGLES.map((toggle) => (
          <label
            key={toggle.key}
            className="flex cursor-pointer items-center justify-between py-3"
          >
            <div>
              <p className="text-sm font-medium">{t(toggle.labelKey)}</p>
              <p className="text-xs text-muted-foreground">
                {t(toggle.descKey)}
              </p>
            </div>
            <input
              type="checkbox"
              name={toggle.key}
              defaultChecked={preferences[toggle.key] !== false}
              className="h-4 w-4 accent-foreground"
            />
          </label>
        ))}
      </div>

      <Button type="submit" variant="outline" disabled={isPending}>
        {isPending ? t("services.saving") : t("notifications.savePreferences")}
      </Button>
    </form>
  );
}
