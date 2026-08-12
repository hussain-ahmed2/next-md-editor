"use client";

import React, { useState, useRef, useEffect } from "react";
import { LayoutTemplate, ChevronDown } from "lucide-react";
import { useEditorStore } from "@next-md-editor/editor-core";
import { TEMPLATES, type TemplateDef } from "@/constants/templates";
import { parseMarkdown } from "@/features/markdown/serializer";
import { ToolbarButton } from "./ToolbarButton";
import { AiTemplateModal } from "./AiTemplateModal";

export function TemplateMenu() {
  const setBlocks = useEditorStore((s) => s.setBlocks);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
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

  const handleLoadTemplate = (tmpl: TemplateDef) => {
    if (tmpl.isAiTemplate) {
      setIsAiModalOpen(true);
    } else if (tmpl.markdown) {
      const parsedBlocks = parseMarkdown(tmpl.markdown);
      setBlocks(parsedBlocks);
    }
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
          className="ide-menu"
          style={{ top: "calc(100% + 4px)", width: 220 }}
        >
          <div className="ide-menu-label">Templates</div>
          {TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              className="ide-menu-item"
              onClick={() => handleLoadTemplate(tmpl)}
              style={{
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 2,
                padding: "6px 10px",
              }}
            >
              <span style={{ fontWeight: 500 }}>{tmpl.name}</span>
              <span style={{ fontSize: 11, opacity: 0.7, lineHeight: 1.3 }}>
                {tmpl.description}
              </span>
            </button>
          ))}
        </div>
      )}
      {isAiModalOpen && <AiTemplateModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />}
    </div>
  );
}
