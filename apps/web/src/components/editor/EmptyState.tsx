"use client";

import { useEditorStore } from "@next-md-editor/editor-core";
import { parseMarkdown } from "@/features/markdown/serializer";
import { TEMPLATES } from "@/constants/templates";
import { BookOpen, FileCode2, NotebookText, FileText, Zap } from "lucide-react";

export function EmptyState() {
  const setBlocks = useEditorStore((s) => s.setBlocks);

  const templateIcons: Record<string, React.ReactNode> = {
    "github-profile": <BookOpen size={18} />,
    "project-readme": <FileText size={18} />,
    "api-docs": <FileCode2 size={18} />,
    blank: <NotebookText size={18} />,
    demo: <Zap size={18} />,
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 40px",
        gap: 24,
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          background: "var(--accent-muted)",
          border: "1px solid rgba(108,126,255,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
        }}
      >
        ✦
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
        Start writing
      </div>
      <div
        style={{
          fontSize: 14,
          color: "var(--text-muted)",
          maxWidth: 400,
          lineHeight: 1.7,
        }}
      >
        Pick a template to get started, or drag a block from the sidebar to build from scratch.
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 8,
          width: "100%",
          maxWidth: 520,
        }}
      >
        {TEMPLATES.map((tmpl) => (
          <button
            key={tmpl.id}
            onClick={() => setBlocks(parseMarkdown(tmpl.markdown))}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              padding: "16px 12px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              background: "rgba(255,255,255,0.01)",
              cursor: "pointer",
              textAlign: "center",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-hover)";
              e.currentTarget.style.borderColor = "var(--border)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.01)";
              e.currentTarget.style.borderColor = "var(--border-subtle)";
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "var(--accent-muted)",
                color: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {templateIcons[tmpl.id] ?? <FileText size={18} />}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
              {tmpl.name}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.3 }}>
              {tmpl.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
