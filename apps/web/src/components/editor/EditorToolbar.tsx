"use client";

import { useEditorStore } from "@next-md-editor/editor-core";
import { serializeToMarkdown, parseMarkdown } from "@/features/markdown/serializer";
import { useRef } from "react";
import {
  Undo2,
  Redo2,
  Zap,
  Upload,
  Eye,
  EyeOff,
  Copy,
  Download,
  CheckCheck,
  Loader2,
} from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { DEMO_MARKDOWN } from "@/constants/editor";

export function EditorToolbar() {
  const previewOpen = useUIStore((s) => s.isMobile ? s.mobileTab === "preview" : s.previewOpen);
  const onTogglePreview = useUIStore((s) => s.togglePreview);
  const saveStatus = useUIStore((s) => s.saveStatus);

  const blocks = useEditorStore((s) => s.blocks);
  const setBlocks = useEditorStore((s) => s.setBlocks);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
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

  const handleLoadDemo = () => {
    const parsedBlocks = parseMarkdown(DEMO_MARKDOWN);
    setBlocks(parsedBlocks);
  };

  return (
    <header style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 20px",
      height: 52,
      background: "var(--bg-surface)",
      borderBottom: "1px solid var(--border-subtle)",
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: "linear-gradient(135deg, var(--accent), #a78bfa)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 800,
          color: "#fff",
          boxShadow: "0 2px 8px var(--accent-glow)",
        }}>M</div>
        <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
          next-md-editor
        </span>
      </div>

      {/* Save Status Indicator */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        color: "var(--text-secondary)",
        marginLeft: 16,
        marginRight: "auto",
        transition: "opacity 0.2s ease",
      }}>
        {saveStatus === "saving" && (
          <>
            <Loader2 size={13} style={{ color: "var(--warning)", animation: "spin 1s linear infinite" }} />
            <span className="save-status-label" style={{ color: "var(--text-secondary)", opacity: 0.8, fontWeight: 500 }}>Saving changes…</span>
          </>
        )}
        {saveStatus === "saved" && (
          <>
            <CheckCheck size={13} style={{ color: "var(--success)" }} />
            <span className="save-status-label" style={{ color: "var(--text-secondary)", opacity: 0.8, fontWeight: 500 }}>Saved to browser</span>
          </>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input
          type="file"
          accept=".md,text/markdown"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        <ToolbarButton onClick={undo} id="btn-undo" tooltip="Undo (Ctrl+Z)">
          <Undo2 size={14} />
          <span className="btn-label">Undo</span>
        </ToolbarButton>
        <ToolbarButton onClick={redo} id="btn-redo" tooltip="Redo (Ctrl+Y)">
          <Redo2 size={14} />
          <span className="btn-label">Redo</span>
        </ToolbarButton>
        <Divider />
        <ToolbarButton onClick={handleLoadDemo} id="btn-load-demo" tooltip="Load demo content">
          <Zap size={14} />
          <span className="btn-label">Demo</span>
        </ToolbarButton>
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
      </div>
    </header>
  );
}

function Divider() {
  return (
    <div style={{
      width: 1,
      height: 20,
      background: "var(--border)",
      margin: "0 2px",
      flexShrink: 0,
    }} />
  );
}

function ToolbarButton({
  children,
  onClick,
  primary,
  active,
  id,
  tooltip,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  active?: boolean;
  id?: string;
  tooltip?: string;
}) {
  return (
    <button
      id={id}
      onClick={onClick}
      title={tooltip}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "5px 10px",
        borderRadius: "var(--radius-sm)",
        border: `1px solid ${primary ? "transparent" : active ? "var(--accent)" : "var(--border)"}`,
        background: primary
          ? "var(--accent)"
          : active
          ? "var(--accent-muted)"
          : "transparent",
        color: primary ? "#fff" : active ? "var(--accent)" : "var(--text-secondary)",
        fontSize: 12.5,
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 0.15s ease",
        fontFamily: "var(--font-sans)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}
