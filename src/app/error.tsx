"use client";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-4 text-center">
      <p className="text-6xl font-black tracking-tight">Error</p>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Something went wrong
        </h1>
        {error.message && (
          <p className="text-muted-foreground">{error.message}</p>
        )}
      </div>
      <button
        onClick={reset}
        className="border border-foreground px-6 py-2.5 text-xs font-medium uppercase tracking-[0.2em] transition-colors hover:bg-foreground hover:text-background"
      >
        Try Again
      </button>
    </div>
  );
}
