"use client";

import React, { useState, useRef, useEffect } from "react";
import { LayoutTemplate, ChevronDown } from "lucide-react";
import { useEditorStore } from "@next-md-editor/editor-core";
import { TEMPLATES } from "@/constants/templates";
import { parseMarkdown } from "@/features/markdown/serializer";
import { ToolbarButton } from "./ToolbarButton";

export function TemplateMenu() {
  const setBlocks = useEditorStore((s) => s.setBlocks);
  const [templateOpen, setTemplateOpen] = useState(false);
  const templateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (templateRef.current && !templateRef.current.contains(e.target as Node)) {
        setTemplateOpen(false);
      }
    }
    if (templateOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [templateOpen]);

  const handleLoadTemplate = (markdown: string) => {
    const parsedBlocks = parseMarkdown(markdown);
    setBlocks(parsedBlocks);
    setTemplateOpen(false);
  };

  return (
    <div ref={templateRef} style={{ position: "relative" }}>
      <ToolbarButton
        onClick={() => setTemplateOpen(!templateOpen)}
        id="btn-templates"
        tooltip="Load a template"
      >
        <LayoutTemplate size={14} />
        <span className="btn-label">Templates</span>
        <ChevronDown size={10} style={{ opacity: 0.6 }} />
      </ToolbarButton>
      {templateOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 100,
            width: 220,
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-lg)",
            display: "flex",
            flexDirection: "column",
            padding: "4px",
            gap: 2,
          }}
        >
          {TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => handleLoadTemplate(tmpl.markdown)}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                padding: "8px 10px",
                borderRadius: "var(--radius-sm)",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.1s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                {tmpl.name}
              </span>
              <span style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.3 }}>
                {tmpl.description}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
