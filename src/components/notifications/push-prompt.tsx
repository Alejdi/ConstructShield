"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const DISMISSED_KEY = "constructshield_push_dismissed";

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

interface PushPromptProps {
  vapidPublicKey: string;
}

export function PushPrompt({ vapidPublicKey }: PushPromptProps) {
  const t = useTranslations();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkShouldShow = useCallback(async () => {
    // Don't show if no VAPID key
    if (!vapidPublicKey) return;

    // Don't show if not supported
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    // Don't show if user already dismissed
    if (localStorage.getItem(DISMISSED_KEY)) return;

    // Don't show if notification permission already decided
    if (Notification.permission !== "default") return;

    // Don't show if already subscribed
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) return;
    } catch {
      return;
    }

    setVisible(true);
  }, [vapidPublicKey]);

  useEffect(() => {
    // Small delay so it doesn't flash on page load
    const timer = setTimeout(checkShouldShow, 1500);
    return () => clearTimeout(timer);
  }, [checkShouldShow]);

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  }

  async function handleEnable() {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error(t("notifications.pushDenied"));
        handleDismiss();
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

      toast.success(t("notifications.pushEnabled"));
    } catch {
      toast.error(t("notifications.pushFailed"));
    }

    handleDismiss();
    setLoading(false);
  }

  if (!visible) return null;

  return (
    <div className="mb-4 flex items-center gap-3 border bg-muted/50 p-3 sm:p-4">
      <Bell className="h-5 w-5 shrink-0 text-foreground" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{t("notifications.pushPromptTitle")}</p>
        <p className="text-xs text-muted-foreground">{t("notifications.pushPromptDesc")}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          size="sm"
          onClick={handleEnable}
          disabled={loading}
        >
          {t("notifications.enablePush")}
        </Button>
        <button
          onClick={handleDismiss}
          className="p-1 text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
