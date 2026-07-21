"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Copy,
  Download,
  Eye,
  EyeOff,
  FileArchive,
  FileCode2,
  FileText,
  FolderUp,
  Printer,
  Upload,
} from "lucide-react";
import { useEditorStore } from "@next-md-editor/editor-core";
import { useUIStore } from "@/store/uiStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { serializeToMarkdown, parseMarkdown } from "@/features/markdown/serializer";
import {
  getFileFormat,
  isMarkdownFile,
  loadFileContent,
} from "@/lib/workspace-storage";
import { collectZipEntries, createZip, downloadBlob, extractZip } from "@/lib/project-zip";
import { buildStandaloneHtml } from "@/lib/export-html";
import { flushPendingSave } from "@/lib/persistence-bridge";
import { ToolbarButton } from "./ToolbarButton";
import type { FileNode } from "@next-md-editor/types";

function MenuItem({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      className="ws-context-item"
      style={disabled ? { opacity: 0.45, cursor: "default" } : undefined}
      onClick={disabled ? undefined : onClick}
    >
      {icon} {label}
    </button>
  );
}

export function ExportMenu() {
  const blocks = useEditorStore((s) => s.blocks);
  const plainText = useUIStore((s) => s.plainText);
  const previewOpen = useUIStore((s) => (s.isMobile ? s.mobileTab === "preview" : s.previewOpen));
  const onTogglePreview = useUIStore((s) => s.togglePreview);
  const activeFileId = useWorkspaceStore((s) => s.activeFileId);
  const nodes = useWorkspaceStore((s) => s.nodes);
  const importFile = useWorkspaceStore((s) => s.importFile);
  const importProject = useWorkspaceStore((s) => s.importProject);

  const [open, setOpen] = useState(false);
  const mdInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  const activeNode: FileNode | null = activeFileId ? (nodes[activeFileId] ?? null) : null;
  const isMd = activeNode ? getFileFormat(activeNode.name) === "blocks" : false;

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [open]);

  const activeMarkdown = () => (isMd ? serializeToMarkdown(blocks) : plainText);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(activeMarkdown());
    setOpen(false);
  };

  const handleDownloadFile = () => {
    if (!activeNode) return;
    const text = activeMarkdown();
    const type = isMd ? "text/markdown" : "text/plain";
    downloadBlob(activeNode.name, new Blob([text], { type }));
    setOpen(false);
  };

  const handleExportHtml = () => {
    if (!activeNode || !isMd) return;
    const title = activeNode.name.replace(/\.(md|markdown)$/i, "");
    const html = buildStandaloneHtml(title, serializeToMarkdown(blocks));
    downloadBlob(`${title}.html`, new Blob([html], { type: "text/html" }));
    setOpen(false);
  };

  const handleExportPdf = () => {
    if (!activeNode || !isMd) return;
    flushPendingSave();
    window.open(`/editor/print?file=${activeNode.id}`, "_blank", "noopener");
    setOpen(false);
  };

  const handleExportZip = () => {
    flushPendingSave();
    const entries = collectZipEntries(nodes, (node) => {
      const content = loadFileContent(node.id);
      if (!content) return "";
      return content.format === "blocks" ? serializeToMarkdown(content.blocks) : content.text;
    });
    if (entries.length === 0) return;
    const zipped = createZip(entries);
    const buffer = new Uint8Array(zipped).buffer as ArrayBuffer;
    downloadBlob("workspace.zip", new Blob([buffer], { type: "application/zip" }));
    setOpen(false);
  };

  const handleMdFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      if (isMarkdownFile(file.name)) {
        importFile(null, file.name, { format: "blocks", blocks: parseMarkdown(text) });
      } else {
        importFile(null, file.name, { format: "text", text });
      }
    });
    e.target.value = "";
    setOpen(false);
  };

  const handleZipFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = new Uint8Array(await file.arrayBuffer());
    const entries = extractZip(data);
    const rootName = file.name.replace(/\.zip$/i, "") || "imported";
    importProject(
      rootName,
      entries.map((entry) => ({
        path: entry.path,
        content: isMarkdownFile(entry.path)
          ? { format: "blocks" as const, blocks: parseMarkdown(entry.text) }
          : { format: "text" as const, text: entry.text },
      })),
    );
    e.target.value = "";
    setOpen(false);
  };

  return (
    <>
      <input
        type="file"
        accept=".md,.markdown,.txt,.json,text/markdown,text/plain"
        ref={mdInputRef}
        onChange={handleMdFile}
        style={{ display: "none" }}
      />
      <input
        type="file"
        accept=".zip,application/zip"
        ref={zipInputRef}
        onChange={handleZipFile}
        style={{ display: "none" }}
      />

      <ToolbarButton onClick={onTogglePreview} active={previewOpen} id="btn-toggle-preview" tooltip="Toggle preview pane">
        {previewOpen ? <EyeOff size={14} /> : <Eye size={14} />}
        <span className="btn-label">{previewOpen ? "Hide Preview" : "Preview"}</span>
      </ToolbarButton>

      <div style={{ position: "relative" }} onMouseDown={(e) => e.stopPropagation()}>
        <ToolbarButton
          onClick={() => setOpen((o) => !o)}
          primary
          id="btn-export-menu"
          tooltip="Import / export files and projects"
        >
          <Download size={14} />
          <span className="btn-label">Share</span>
        </ToolbarButton>

        {open && (
          <div
            className="ws-context-menu"
            style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, left: "auto" }}
          >
            <MenuItem
              icon={<Copy size={14} />}
              label="Copy as Markdown"
              onClick={handleCopy}
              disabled={!activeNode}
            />
            <MenuItem
              icon={<FileText size={14} />}
              label={`Download ${activeNode?.name ?? "file"}`}
              onClick={handleDownloadFile}
              disabled={!activeNode}
            />
            <MenuItem
              icon={<FileCode2 size={14} />}
              label="Export as HTML"
              onClick={handleExportHtml}
              disabled={!isMd}
            />
            <MenuItem
              icon={<Printer size={14} />}
              label="Export as PDF (print)"
              onClick={handleExportPdf}
              disabled={!isMd}
            />
            <div className="ws-context-sep" />
            <MenuItem
              icon={<FileArchive size={14} />}
              label="Export project as ZIP"
              onClick={handleExportZip}
            />
            <div className="ws-context-sep" />
            <MenuItem
              icon={<Upload size={14} />}
              label="Import file…"
              onClick={() => mdInputRef.current?.click()}
            />
            <MenuItem
              icon={<FolderUp size={14} />}
              label="Import project ZIP…"
              onClick={() => zipInputRef.current?.click()}
            />
          </div>
        )}
      </div>
    </>
  );
}
