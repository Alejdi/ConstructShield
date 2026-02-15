"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <AlertTriangle className="h-10 w-10 text-destructive" />
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        {error.message && (
          <p className="text-muted-foreground text-sm">{error.message}</p>
        )}
      </div>
      <Button onClick={reset} size="sm">
        Try Again
      </Button>
    </div>
  );
}
