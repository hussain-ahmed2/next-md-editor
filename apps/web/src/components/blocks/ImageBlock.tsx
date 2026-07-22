"use client";

import { useState, useRef } from "react";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import { handleEditorKeyboardShortcuts } from "@/utils/editorShortcuts";
import { useBlockFocus } from "@/hooks/useBlockFocus";
import { Image as ImageIcon, Edit2 } from "lucide-react";

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop";

export function ImageBlock({ block }: { block: Block }) {
  const blocks = useEditorStore((s) => s.blocks);
  const addBlock = useEditorStore((s) => s.addBlock);
  const removeBlocks = useEditorStore((s) => s.removeBlocks);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const selectedBlockIds = useEditorStore((s) => s.selectedBlockIds);


  const url = (block.props.url as string) ?? "";
  const alt = (block.props.alt as string) ?? "";

  const [isEditing, setIsEditing] = useState(!url);
  const [inputUrl, setInputUrl] = useState(url);
  const [inputAlt, setInputAlt] = useState(alt);
  const ref = useRef<HTMLDivElement>(null);

  useBlockFocus(ref, block.id, selectedBlockIds);

  const handleSave = () => {
    updateBlock(block.id, { url: inputUrl || DEFAULT_IMAGE, alt: inputAlt || "Image Description" });
    setIsEditing(false);
  };

  return (
    <div
      ref={ref}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey && isEditing) {
          e.preventDefault();
          handleSave();
          return;
        }
        handleEditorKeyboardShortcuts(e, block, blocks, selectedBlockIds, addBlock, removeBlocks, updateBlock, selectBlock);
      }}
      style={{
        outline: "none",
        width: "100%",
        padding: "8px 0",
      }}
    >
      {isEditing ? (
        <div
          style={{
            padding: "12px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
            background: "var(--bg-surface)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <ImageIcon size={13} style={{ color: "var(--text-muted)" }} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
              }}
            >
              Configure Image Block
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", color: "var(--text-muted)" }}>
              IMAGE URL
            </label>
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://example.com/image.png"
              className="ide-input"
              style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", color: "var(--text-muted)" }}>
              ALT TEXT
            </label>
            <input
              type="text"
              value={inputAlt}
              onChange={(e) => setInputAlt(e.target.value)}
              placeholder="Description of the image..."
              className="ide-input"
              style={{ fontSize: 12 }}
            />
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
            {url && (
              <button onClick={() => setIsEditing(false)} className="ide-btn">
                Cancel
              </button>
            )}
            <button onClick={handleSave} className="ide-btn primary">
              Apply Image
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            position: "relative",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
            border: "1px solid var(--border-subtle)",
            background: "var(--bg-surface)",
            minHeight: 120,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url || DEFAULT_IMAGE}
            alt={alt}
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              maxHeight: 500,
              objectFit: "contain",
            }}
          />

          <div
            onClick={() => setIsEditing(true)}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              height: 24,
              padding: "0 8px",
              borderRadius: "var(--radius-sm)",
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              fontSize: 11,
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontFamily: "var(--font-sans)",
            }}
          >
            <Edit2 size={13} /> Edit Image
          </div>
        </div>
      )}
    </div>
  );
}
