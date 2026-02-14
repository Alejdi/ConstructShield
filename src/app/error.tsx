"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 text-center">
      <AlertTriangle className="h-16 w-16 text-destructive" />
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">
          Something went wrong
        </h1>
        {error.message && (
          <p className="text-muted-foreground text-lg">{error.message}</p>
        )}
      </div>
      <Button onClick={reset}>Try Again</Button>
    </div>
  );
}
