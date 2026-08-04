import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
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
      <div style={{ maxWidth: 420, textAlign: "center" }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.08em",
            color: "var(--text-muted)",
            marginBottom: 8,
          }}
        >
          404
        </p>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Page not found</h1>
        <p
          style={{
            fontSize: 13.5,
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            marginBottom: 20,
          }}
        >
          That page doesn&apos;t exist. Head back to the editor to keep writing.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <Link href="/editor" className="ide-btn primary" style={{ textDecoration: "none" }}>
            Open editor
          </Link>
          <Link href="/" className="ide-btn" style={{ textDecoration: "none" }}>
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
