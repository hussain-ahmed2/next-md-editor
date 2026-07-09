"use client";

import { useRef, useState } from "react";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import { handleEditorKeyboardShortcuts } from "@/utils/editorShortcuts";
import { useBlockFocus } from "@/hooks/useBlockFocus";
import { Link, Image as ImageIcon, Settings } from "lucide-react";

export function HeroBlock({ block }: { block: Block }) {
  const blocks = useEditorStore((s) => s.blocks);
  const addBlock = useEditorStore((s) => s.addBlock);
  const removeBlocks = useEditorStore((s) => s.removeBlocks);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const selectedBlockIds = useEditorStore((s) => s.selectedBlockIds);

  const logoUrl = (block.props.logoUrl as string) ?? "";
  const title = (block.props.title as string) ?? "Project Title";
  const description = (block.props.description as string) ?? "An awesome open-source project.";
  const primaryBtnText = (block.props.primaryBtnText as string) ?? "Get Started";
  const primaryBtnUrl = (block.props.primaryBtnUrl as string) ?? "#";
  const secondaryBtnText = (block.props.secondaryBtnText as string) ?? "Documentation";
  const secondaryBtnUrl = (block.props.secondaryBtnUrl as string) ?? "#";

  const [showSettings, setShowSettings] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useBlockFocus(ref, block.id, selectedBlockIds);

  const updateProp = (key: string, value: string) => {
    updateBlock(block.id, { [key]: value });
  };

  return (
    <div
      ref={ref}
      tabIndex={0}
      onKeyDown={(e) => {
        handleEditorKeyboardShortcuts(
          e,
          block,
          blocks,
          selectedBlockIds,
          addBlock,
          removeBlocks,
          updateBlock,
          selectBlock,
        );
      }}
      style={{
        outline: "none",
        width: "100%",
        position: "relative",
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
      }}
    >
      <div
        contentEditable={false}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 10,
        }}
      >
        <button
          onClick={() => setShowSettings(!showSettings)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
            background: showSettings ? "var(--accent)" : "var(--bg-base)",
            color: showSettings ? "white" : "var(--text-muted)",
            border: "1px solid var(--border)",
            borderRadius: "50%",
            cursor: "pointer",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            transition: "all 0.2s",
          }}
          title="Hero Settings"
        >
          <Settings size={16} />
        </button>
      </div>

      {showSettings && (
        <div
          contentEditable={false}
          style={{
            background: "var(--bg-base)",
            borderBottom: "1px solid var(--border-subtle)",
            padding: "16px 20px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
              <ImageIcon size={14} /> Logo URL
            </label>
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => updateProp("logoUrl", e.target.value)}
              placeholder="https://..."
              style={{ padding: "6px 8px", fontSize: 13, border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--bg-surface)", color: "var(--text-primary)" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
              <Link size={14} /> Primary Button Text
            </label>
            <input
              type="text"
              value={primaryBtnText}
              onChange={(e) => updateProp("primaryBtnText", e.target.value)}
              placeholder="Get Started"
              style={{ padding: "6px 8px", fontSize: 13, border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--bg-surface)", color: "var(--text-primary)" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
              <Link size={14} /> Primary Button URL
            </label>
            <input
              type="text"
              value={primaryBtnUrl}
              onChange={(e) => updateProp("primaryBtnUrl", e.target.value)}
              placeholder="https://..."
              style={{ padding: "6px 8px", fontSize: 13, border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--bg-surface)", color: "var(--text-primary)" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
              <Link size={14} /> Secondary Button Text
            </label>
            <input
              type="text"
              value={secondaryBtnText}
              onChange={(e) => updateProp("secondaryBtnText", e.target.value)}
              placeholder="Documentation"
              style={{ padding: "6px 8px", fontSize: 13, border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--bg-surface)", color: "var(--text-primary)" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
              <Link size={14} /> Secondary Button URL
            </label>
            <input
              type="text"
              value={secondaryBtnUrl}
              onChange={(e) => updateProp("secondaryBtnUrl", e.target.value)}
              placeholder="https://..."
              style={{ padding: "6px 8px", fontSize: 13, border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--bg-surface)", color: "var(--text-primary)" }}
            />
          </div>
        </div>
      )}

      <div style={{ padding: "48px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt="Logo"
            style={{ width: 100, height: 100, objectFit: "contain", marginBottom: 24 }}
          />
        )}
        {!logoUrl && (
          <div style={{ width: 100, height: 100, marginBottom: 24, borderRadius: "50%", background: "var(--bg-base)", border: "2px dashed var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 12, flexDirection: "column", gap: 4 }}>
            <ImageIcon size={24} />
            <span>No Logo</span>
          </div>
        )}

        <input
          type="text"
          value={title}
          onChange={(e) => updateProp("title", e.target.value)}
          placeholder="Project Title"
          style={{
            fontSize: 42,
            fontWeight: 800,
            background: "transparent",
            border: "none",
            outline: "none",
            textAlign: "center",
            width: "100%",
            color: "var(--text-primary)",
            marginBottom: 16,
          }}
        />

        <input
          type="text"
          value={description}
          onChange={(e) => updateProp("description", e.target.value)}
          placeholder="A short description of your project..."
          style={{
            fontSize: 18,
            color: "var(--text-secondary)",
            background: "transparent",
            border: "none",
            outline: "none",
            textAlign: "center",
            width: "100%",
            maxWidth: 600,
            marginBottom: 32,
          }}
        />

        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
          <a href={primaryBtnUrl} target="_blank" rel="noreferrer" onClick={(e) => e.preventDefault()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={`https://img.shields.io/badge/${encodeURIComponent(primaryBtnText.replace(/-/g, "--"))}-000000?style=for-the-badge`} 
              alt={primaryBtnText} 
              style={{ height: 28 }}
            />
          </a>
          <a href={secondaryBtnUrl} target="_blank" rel="noreferrer" onClick={(e) => e.preventDefault()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={`https://img.shields.io/badge/${encodeURIComponent(secondaryBtnText.replace(/-/g, "--"))}-ffffff?style=for-the-badge`} 
              alt={secondaryBtnText} 
              style={{ height: 28 }}
            />
          </a>
        </div>
      </div>
    </div>
  );
}
