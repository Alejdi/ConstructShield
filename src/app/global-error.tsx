"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
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
    <html>
      <body>
        <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "2rem", padding: "1rem", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
          <p style={{ fontSize: "3rem", fontWeight: 900, letterSpacing: "-0.02em" }}>Error</p>
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Something went wrong</h1>
            {error.message && (
              <p style={{ color: "#666", marginTop: "0.5rem" }}>{error.message}</p>
            )}
          </div>
          <button
            onClick={reset}
            style={{ border: "1px solid #000", padding: "0.625rem 1.5rem", fontSize: "0.75rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.2em", cursor: "pointer", background: "transparent" }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
