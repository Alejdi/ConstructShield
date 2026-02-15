"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PushToggleProps {
  vapidPublicKey: string;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushToggle({ vapidPublicKey }: PushToggleProps) {
  const t = useTranslations();
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkSubscription = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setSupported(false);
      setLoading(false);
      return;
    }

    setSupported(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setSubscribed(!!subscription);
    } catch {
      setSubscribed(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  async function handleSubscribe() {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error(t("notifications.pushDenied"));
        setLoading(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const res = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });

      if (!res.ok) throw new Error("Failed to save subscription");

      setSubscribed(true);
      toast.success(t("notifications.pushEnabled"));
    } catch {
      toast.error(t("notifications.pushFailed"));
    }
    setLoading(false);
  }

  async function handleUnsubscribe() {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();

        await fetch("/api/push", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        });
      }

      setSubscribed(false);
      toast.success(t("notifications.pushDisabled"));
    } catch {
      toast.error(t("notifications.pushFailed"));
    }
    setLoading(false);
  }

  if (!supported) {
    return (
      <p className="text-xs text-muted-foreground">
        {t("notifications.pushNotSupported")}
      </p>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {subscribed ? (
          <Bell className="h-4 w-4 text-trust-green" />
        ) : (
          <BellOff className="h-4 w-4 text-muted-foreground" />
        )}
        <div>
          <p className="text-sm font-medium">{t("notifications.pushNotifications")}</p>
          <p className="text-xs text-muted-foreground">
            {subscribed
              ? t("notifications.pushEnabledDesc")
              : t("notifications.pushDisabledDesc")}
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={subscribed ? handleUnsubscribe : handleSubscribe}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : subscribed ? (
          t("notifications.disablePush")
        ) : (
          t("notifications.enablePush")
        )}
      </Button>
    </div>
  );
}
