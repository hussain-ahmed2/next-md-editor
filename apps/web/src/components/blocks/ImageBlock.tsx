"use client";

import { useState, useRef } from "react";
import { useEditorStore } from "@next-md-editor/editor-core";
import type { Block } from "@next-md-editor/types";
import { handleEditorKeyboardShortcuts } from "@/utils/editorShortcuts";
import { useBlockFocus } from "@/hooks/useBlockFocus";

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
            padding: "16px",
            borderRadius: "var(--radius-md)",
            border: "1px dashed var(--border)",
            background: "var(--bg-elevated)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>🖼️</span>
            <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>
              Configure Image Block
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              IMAGE URL
            </label>
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://example.com/image.png"
              style={{
                padding: "8px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                fontSize: 13,
                outline: "none",
                fontFamily: "var(--font-mono)",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              ALT TEXT
            </label>
            <input
              type="text"
              value={inputAlt}
              onChange={(e) => setInputAlt(e.target.value)}
              placeholder="Description of the image..."
              style={{
                padding: "8px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                fontSize: 13,
                outline: "none",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
            {url && (
              <button
                onClick={() => setIsEditing(false)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--text-secondary)",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSave}
              style={{
                padding: "6px 16px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid transparent",
                background: "var(--accent)",
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 8px var(--accent-glow)",
              }}
            >
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
              top: 12,
              right: 12,
              padding: "4px 10px",
              borderRadius: "4px",
              background: "rgba(15, 15, 15, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#fff",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              boxShadow: "var(--shadow-sm)",
              backdropFilter: "blur(4px)",
              fontFamily: "var(--font-sans)",
            }}
          >
            ✏️ Edit Image
          </div>
        </div>
      )}
    </div>
  );
}
