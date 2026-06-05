"use client";

import React, { useRef } from "react";
import { Upload, Eye, EyeOff, Copy, Download } from "lucide-react";
import { useEditorStore } from "@next-md-editor/editor-core";
import { useUIStore } from "@/store/uiStore";
import { serializeToMarkdown, parseMarkdown } from "@/features/markdown/serializer";
import { ToolbarButton } from "./ToolbarButton";

export function FileActions() {
  const blocks = useEditorStore((s) => s.blocks);
  const setBlocks = useEditorStore((s) => s.setBlocks);

  const previewOpen = useUIStore((s) => s.isMobile ? s.mobileTab === "preview" : s.previewOpen);
  const onTogglePreview = useUIStore((s) => s.togglePreview);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopy = async () => {
    const md = serializeToMarkdown(blocks);
    await navigator.clipboard.writeText(md);
  };

  const handleDownload = () => {
    const md = serializeToMarkdown(blocks);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const parsedBlocks = parseMarkdown(text);
        setBlocks(parsedBlocks);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <>
      <input
        type="file"
        accept=".md,text/markdown"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <ToolbarButton onClick={handleImportClick} id="btn-import-md" tooltip="Import a .md file">
        <Upload size={14} />
        <span className="btn-label">Import</span>
      </ToolbarButton>
      <ToolbarButton onClick={onTogglePreview} active={previewOpen} id="btn-toggle-preview" tooltip="Toggle preview pane">
        {previewOpen ? <EyeOff size={14} /> : <Eye size={14} />}
        <span className="btn-label">{previewOpen ? "Hide Preview" : "Preview"}</span>
      </ToolbarButton>
      <ToolbarButton onClick={handleCopy} id="btn-copy-md" tooltip="Copy as Markdown">
        <Copy size={14} />
        <span className="btn-label">Copy</span>
      </ToolbarButton>
      <ToolbarButton onClick={handleDownload} primary id="btn-download-md" tooltip="Download as .md">
        <Download size={14} />
        <span className="btn-label">Download</span>
      </ToolbarButton>
    </>
  );
}
