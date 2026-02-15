"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const t = useTranslations("pwa");
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Don't show if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // Don't show if iOS standalone
    if ("standalone" in navigator && (navigator as any).standalone) return;
    // Don't show if user dismissed before
    if (localStorage.getItem("pwa-install-dismissed")) return;

    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () =>
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShow(false);
    }
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    setShow(false);
    setDeferredPrompt(null);
    localStorage.setItem("pwa-install-dismissed", "1");
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300 lg:hidden">
      <div className="flex items-center gap-3 rounded-lg border bg-background p-4 shadow-lg">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-foreground text-background">
          <Download className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{t("installTitle")}</p>
          <p className="text-xs text-muted-foreground">{t("installDesc")}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={handleInstall}
            className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium uppercase tracking-[0.1em] text-background transition-colors hover:bg-foreground/90"
          >
            {t("install")}
          </button>
          <button
            onClick={handleDismiss}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
            aria-label={t("dismiss")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
