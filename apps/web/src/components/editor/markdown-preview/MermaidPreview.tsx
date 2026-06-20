"use client";

import { useEffect, useRef, useState } from "react";

export function MermaidPreview({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function render() {
      try {
        const mermaid = await import("mermaid");
        mermaid.default.initialize({
          startOnLoad: false,
          theme: document.documentElement.dataset.theme === "light" ? "default" : "dark",
          fontFamily: "var(--font-sans)",
        });
        if (!ref.current || cancelled) return;
        ref.current.innerHTML = "";
        const { svg } = await mermaid.default.render("mermaid-" + Math.random().toString(36).substring(7), code);
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to render diagram");
      }
    }
    render();
    return () => { cancelled = true; };
  }, [code]);

  if (error) {
    return (
      <div style={{ padding: 12, color: "var(--danger)", fontSize: 12, fontFamily: "var(--font-mono)", whiteSpace: "pre-wrap" }}>
        {error}
      </div>
    );
  }

  return <div ref={ref} style={{ padding: "8px 0", overflow: "auto" }} />;
}
