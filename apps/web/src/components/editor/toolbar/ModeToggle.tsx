"use client";

import React from "react";
import { FileText, FileCode2 } from "lucide-react";
import { useEditorStore } from "@next-md-editor/editor-core";
import { useUIStore } from "@/store/uiStore";
import { serializeToMarkdown, parseMarkdown } from "@/features/markdown/serializer";
import { ToolbarButton } from "./ToolbarButton";

export function ModeToggle() {
  const editorMode = useUIStore((s) => s.editorMode);
  const setEditorMode = useUIStore((s) => s.setEditorMode);
  const sourceText = useUIStore((s) => s.sourceText);
  const setSourceText = useUIStore((s) => s.setSourceText);

  const blocks = useEditorStore((s) => s.blocks);
  const setBlocks = useEditorStore((s) => s.setBlocks);

  const handleToggleMode = () => {
    if (editorMode === "canvas") {
      const md = serializeToMarkdown(blocks);
      setSourceText(md);
      setEditorMode("source");
    } else {
      const parsed = parseMarkdown(sourceText);
      setBlocks(parsed);
      setEditorMode("canvas");
    }
  };

  return (
    <ToolbarButton
      onClick={handleToggleMode}
      active={editorMode === "source"}
      id="btn-toggle-mode"
      tooltip="Switch between visual canvas and raw markdown"
    >
      {editorMode === "source" ? <FileText size={14} /> : <FileCode2 size={14} />}
      <span className="btn-label">{editorMode === "source" ? "Canvas" : "Source"}</span>
    </ToolbarButton>
  );
}
