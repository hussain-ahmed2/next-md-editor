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
import { useUIStore } from "@/store/uiStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import {
  canExportDocument,
  copyActiveAsMarkdown,
  downloadActiveFile,
  exportActiveAsHtml,
  exportActiveAsPdf,
  exportProjectZip,
  importProjectZipFile,
  importSingleFile,
} from "@/lib/file-actions";
import { ToolbarButton } from "./ToolbarButton";

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
      className={`ide-menu-item${disabled ? " disabled" : ""}`}
      onClick={disabled ? undefined : onClick}
    >
      {icon} {label}
    </button>
  );
}

export function ExportMenu() {
  const previewOpen = useUIStore((s) => (s.isMobile ? s.mobileTab === "preview" : s.previewOpen));
  const onTogglePreview = useUIStore((s) => s.togglePreview);
  const activeFileId = useWorkspaceStore((s) => s.activeFileId);
  const activeName = useWorkspaceStore((s) =>
    s.activeFileId ? (s.nodes[s.activeFileId]?.name ?? null) : null,
  );

  const [open, setOpen] = useState(false);
  const mdInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  const isDoc = canExportDocument();

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [open]);

  const run = (action: () => void) => () => {
    action();
    setOpen(false);
  };

  const handleFile =
    (handler: (file: File) => Promise<void>) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void handler(file);
      e.target.value = "";
      setOpen(false);
    };

  return (
    <>
      <input
        type="file"
        accept=".md,.markdown,.txt,.json,text/markdown,text/plain"
        ref={mdInputRef}
        onChange={handleFile(importSingleFile)}
        style={{ display: "none" }}
      />
      <input
        type="file"
        accept=".zip,application/zip"
        ref={zipInputRef}
        onChange={handleFile(importProjectZipFile)}
        style={{ display: "none" }}
      />

      <ToolbarButton
        onClick={onTogglePreview}
        active={previewOpen}
        id="btn-toggle-preview"
        tooltip="Toggle preview pane"
      >
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
            className="ide-menu"
            style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, left: "auto" }}
          >
            <MenuItem
              icon={<Copy size={14} />}
              label="Copy as Markdown"
              onClick={run(() => void copyActiveAsMarkdown())}
              disabled={!activeFileId}
            />
            <MenuItem
              icon={<FileText size={14} />}
              label={`Download ${activeName ?? "file"}`}
              onClick={run(downloadActiveFile)}
              disabled={!activeFileId}
            />
            <MenuItem
              icon={<FileCode2 size={14} />}
              label="Export as HTML"
              onClick={run(exportActiveAsHtml)}
              disabled={!isDoc}
            />
            <MenuItem
              icon={<Printer size={14} />}
              label="Export as PDF (print)"
              onClick={run(exportActiveAsPdf)}
              disabled={!isDoc}
            />
            <div className="ide-menu-sep" />
            <MenuItem
              icon={<FileArchive size={14} />}
              label="Export project as ZIP"
              onClick={run(exportProjectZip)}
            />
            <div className="ide-menu-sep" />
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
