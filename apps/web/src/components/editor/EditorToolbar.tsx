"use client";

import { useEditorStore } from "@next-md-editor/editor-core";
import { serializeToMarkdown, parseMarkdown } from "@/features/markdown/serializer";
import { useRef } from "react";

interface EditorToolbarProps {
  previewOpen: boolean;
  onTogglePreview: () => void;
  saveStatus?: "saving" | "saved" | "idle";
}

const DEMO_MARKDOWN = `# Welcome to next-md-editor!

This is a beautiful block-based markdown editor built with Next.js and Turborepo workspaces.

---

> Block-based editing makes reordering elements intuitive and fun. Drag and drop any block using the handle on the left side of the block!

\`\`\`ts
// Happy coding!
const editorName = "next-md-editor";
console.log(\`Successfully loaded demo in \${editorName}!\`);
\`\`\``;

export function EditorToolbar({ previewOpen, onTogglePreview, saveStatus = "idle" }: EditorToolbarProps) {
  const blocks = useEditorStore((s) => s.blocks);
  const setBlocks = useEditorStore((s) => s.setBlocks);
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
    // Reset file input value
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
            <span style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--warning)",
              display: "inline-block",
              animation: "pulse 0.8s infinite alternate",
            }} />
            <span style={{ color: "var(--text-secondary)", opacity: 0.8, fontWeight: 500 }}>Saving changes…</span>
          </>
        )}
        {saveStatus === "saved" && (
          <>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--success)",
              display: "inline-block",
            }} />
            <span style={{ color: "var(--text-secondary)", opacity: 0.8, fontWeight: 500 }}>Saved to browser</span>
          </>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="file"
          accept=".md,text/markdown"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        <ToolbarButton onClick={handleLoadDemo} id="btn-load-demo">
          ⚡ Load Demo
        </ToolbarButton>
        <ToolbarButton onClick={handleImportClick} id="btn-import-md">
          Import .md
        </ToolbarButton>
        <ToolbarButton onClick={onTogglePreview} active={previewOpen} id="btn-toggle-preview">
          {previewOpen ? "Hide Preview" : "Show Preview"}
        </ToolbarButton>
        <ToolbarButton onClick={handleCopy} id="btn-copy-md">
          Copy Markdown
        </ToolbarButton>
        <ToolbarButton onClick={handleDownload} primary id="btn-download-md">
          ↓ Download .md
        </ToolbarButton>
      </div>
    </header>
  );
}

function ToolbarButton({
  children,
  onClick,
  primary,
  active,
  id,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  active?: boolean;
  id?: string;
}) {
  return (
    <button
      id={id}
      onClick={onClick}
      style={{
        padding: "6px 14px",
        borderRadius: "var(--radius-sm)",
        border: `1px solid ${primary ? "transparent" : active ? "var(--accent)" : "var(--border)"}`,
        background: primary
          ? "var(--accent)"
          : active
          ? "var(--accent-muted)"
          : "transparent",
        color: primary ? "#fff" : active ? "var(--accent)" : "var(--text-secondary)",
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 0.15s ease",
        fontFamily: "var(--font-sans)",
      }}
    >
      {children}
    </button>
  );
}
