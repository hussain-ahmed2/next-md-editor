"use client";

import { useState } from "react";
import { useEditorStore } from "@next-md-editor/editor-core";
import { parseMarkdown } from "@/features/markdown/serializer";
import { TEMPLATES, type TemplateDef } from "@/constants/templates";
import { BookOpen, FileCode2, NotebookText, FileText, Zap } from "lucide-react";
import { AiTemplateModal } from "./toolbar/AiTemplateModal";

export function EmptyState() {
  const setBlocks = useEditorStore((s) => s.setBlocks);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const handleTemplateClick = (tmpl: TemplateDef) => {
    if (tmpl.isAiTemplate) {
      setIsAiModalOpen(true);
    } else if (tmpl.markdown) {
      setBlocks(parseMarkdown(tmpl.markdown));
    }
  };

  const templateIcons: Record<string, React.ReactNode> = {
    "github-profile": <BookOpen size={16} />,
    "project-readme": <FileText size={16} />,
    "api-docs": <FileCode2 size={16} />,
    blank: <NotebookText size={16} />,
    demo: <Zap size={16} />,
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 32px",
        gap: 16,
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "var(--radius-md)",
          background: "var(--accent-muted)",
          border: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
        }}
      >
        ✦
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
        Start writing
      </div>
      <div
        style={{
          fontSize: 13,
          color: "var(--text-muted)",
          maxWidth: 400,
          lineHeight: 1.5,
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
            onClick={() => handleTemplateClick(tmpl)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              padding: "12px 10px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              background: "var(--bg-surface)",
              cursor: "pointer",
              textAlign: "center",
              transition: "background 0.15s ease, border-color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-hover)";
              e.currentTarget.style.borderColor = "var(--border)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--bg-surface)";
              e.currentTarget.style.borderColor = "var(--border-subtle)";
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "var(--radius-sm)",
                background: "var(--accent-muted)",
                color: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {templateIcons[tmpl.id] ?? <FileText size={16} />}
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
      {isAiModalOpen && <AiTemplateModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />}
    </div>
  );
}
