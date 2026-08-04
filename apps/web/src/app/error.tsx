"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Route-level error boundary. Keeps a crash recoverable (and the user's
 * localStorage workspace intact) instead of showing a blank page.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "var(--bg-base)",
        color: "var(--text-primary)",
      }}
    >
      <div style={{ maxWidth: 460, textAlign: "center" }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Something went wrong</h1>
        <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 20 }}>
          The editor hit an unexpected error. Your files are stored in this browser and have not
          been lost — reloading usually restores everything.
        </p>
        {error.digest && (
          <p style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 20 }}>
            Reference: {error.digest}
          </p>
        )}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={reset} className="ide-btn primary">
            Try again
          </button>
          <Link href="/editor" className="ide-btn" style={{ textDecoration: "none" }}>
            Reload editor
          </Link>
          <Link href="/" className="ide-btn" style={{ textDecoration: "none" }}>
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
