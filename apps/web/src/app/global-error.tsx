"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary: catches failures in the root layout itself, where
 * the normal error page (and app CSS) is unavailable. Must render its own
 * <html>/<body>, so styles are inlined rather than using theme tokens.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Fatal application error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: "#1e1f22",
          color: "#dfe1e5",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 10px" }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 13.5, color: "#9da0a8", lineHeight: 1.6, margin: "0 0 20px" }}>
            The application failed to load. Your documents are saved in this browser and are not
            affected.
          </p>
          <button
            onClick={reset}
            style={{
              height: 30,
              padding: "0 14px",
              border: "none",
              borderRadius: 4,
              background: "#3574f0",
              color: "#fff",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
